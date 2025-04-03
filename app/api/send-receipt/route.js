import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: {
    schema: "next_auth",
  }
});

// Add this before using the template
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

export async function POST(req) {
  try {
    const { donorId, receiptData } = await req.json();
    console.log('Received donorId:', donorId); // Add debug log

    // Fetch donor details using donor_number instead of id
    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .select('phone')
      .eq('donor_number', donorId) // Change this from 'id' to 'donor_number'
      .single();

    if (donorError) {
      console.error('Donor fetch error:', donorError); // Add debug log
      throw new Error('Failed to fetch donor details');
    }

    if (!donor?.phone) {
      throw new Error('Donor phone number not found');
    }

    // Generate PDF using template
    let browser;
    if (process.env.NODE_ENV === 'development') {
      // Local development - use local Chrome
      browser = await puppeteer.launch({
        executablePath: process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome',
        args: chromium.args,
        headless: "new",
      });
    } else {
      // Production - use chrome-aws-lambda
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();
    
    // Set viewport and allow local file access
    await page.setViewport({ width: 800, height: 1200 });
    
    // Get the absolute path to the static folder
    const staticPath = join(process.cwd(), 'static');
    
    // Override the page's request handling to serve local files
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      const url = request.url();
      if (url.startsWith('file://')) {
        const filePath = url.replace('file://', '');
        try {
          const content = readFileSync(filePath);
          request.respond({
            status: 200,
            contentType: 'image/png',
            body: content
          });
        } catch (error) {
          request.abort();
        }
      } else {
        request.continue();
      }
    });

    // Format dates and numbers in receiptData
    const formattedReceiptData = {
      ...receiptData,
      donation: {
        ...receiptData.donation,
        date: new Date(receiptData.donation.date).toLocaleDateString('en-GB'),
        amount: receiptData.donation.amount.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })
      }
    };

    // Read and compile template based on organization and message preference
    const templateName = receiptData.organization.name === 'Seeshan' ? 
      (receiptData.noCustomMessage ? 'seeshan-receipt-no-text.hbs' : 'seeshan-receipt.hbs') : 
      (receiptData.noCustomMessage ? 'mim-receipt-no-text.hbs' : 'mim-receipt.hbs');
    
    const templatePath = join(process.cwd(), 'templates', templateName);
    const templateHtml = readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const html = template(formattedReceiptData);

    // Set page content and wait for network and styles to load
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Generate PDF with proper styling
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true, // Important for background colors
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Upload PDF to Supabase storage
    const fileName = `receipt_${Date.now()}.pdf`;
    const filePath = `receipts/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('Donor')
      .upload(filePath, pdf, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Donor')
      .getPublicUrl(filePath);

    // Send WhatsApp message
    const messageData = new URLSearchParams({
      appkey: process.env.WHATSAPP_APP_KEY,
      authkey: 'jSvVJO1Lp3u07oDKDESCrDxyBoV7LSZ0UrMCT5t642H15j9YNX',
      to: donor.phone,
      message: 'Thank you for your contribution!',
      file: publicUrl
    });

    const messageResponse = await fetch('https://acs.agoo.in/api/create-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: messageData
    });

    if (!messageResponse.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    // Cleanup: Delete PDF from storage
    await supabase.storage.from('Donor').remove([filePath]);

    return NextResponse.json({ 
      message: "Receipt sent successfully" 
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}