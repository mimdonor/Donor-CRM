import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,{
  db: {
      schema: "next_auth",
  }
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
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

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

    // Read and compile template
    const templatePath = join(process.cwd(), 'templates', 'receipt.hbs');
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
      appkey: 'c41cb8a9-e232-4ec5-b098-6e5c8f51deb7',
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