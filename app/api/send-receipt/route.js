import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "next_auth" }
});

handlebars.registerHelper('eq', (a, b) => a === b);

export async function POST(req) {
  try {
    const { donorId, receiptData } = await req.json();

    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .select('phone')
      .eq('donor_number', donorId)
      .single();

    if (donorError || !donor?.phone) {
      throw new Error('Failed to fetch donor phone number');
    }

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

    const templateName = receiptData.organization.name === 'Seeshan' ?
      (receiptData.noCustomMessage ? 'seeshan-receipt-no-text.hbs' : 'seeshan-receipt.hbs') :
      (receiptData.noCustomMessage ? 'mim-receipt-no-text.hbs' : 'mim-receipt.hbs');

    const templatePath = join(process.cwd(), 'templates', templateName);
    const templateHtml = readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const html = template(formattedReceiptData);

    // ✅ Generate PDF using Browserless
    const browserlessPDFResponse = await fetch(`https://chrome.browserless.io/pdf?token=${process.env.BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        options: {
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
          format: 'A4'
        }
      })
    });

    if (!browserlessPDFResponse.ok) {
      throw new Error('PDF generation failed from Browserless');
    }

    const pdf = await browserlessPDFResponse.arrayBuffer();

    const fileName = `receipt_${Date.now()}.pdf`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('Donor')
      .upload(filePath, Buffer.from(pdf), {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('Donor')
      .getPublicUrl(filePath);

    // ✅ Send WhatsApp message
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

    // ✅ Optional cleanup
    await supabase.storage.from('Donor').remove([filePath]);

    return NextResponse.json({ message: "Receipt sent successfully" });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
