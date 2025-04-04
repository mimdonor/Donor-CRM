import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import nodeHtmlToImage from 'node-html-to-image';
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
    console.log('Received donorId:', donorId);

    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .select('phone')
      .eq('donor_number', donorId)
      .single();

    if (donorError) {
      console.error('Donor fetch error:', donorError);
      throw new Error('Failed to fetch donor details');
    }

    if (!donor?.phone) {
      throw new Error('Donor phone number not found');
    }

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

    // Generate image from HTML
    const image = await nodeHtmlToImage({
      html: html,
      quality: 100,
      type: 'jpeg',
      puppeteerArgs: {
        args: ['--no-sandbox']
      }
    });

    // Upload image to Supabase storage
    const fileName = `receipt_${Date.now()}.jpg`;
    const filePath = `receipts/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('Donor')
      .upload(filePath, image, {
        contentType: 'image/jpeg',
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

    // Cleanup: Delete image from storage
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