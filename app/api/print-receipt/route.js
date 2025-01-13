import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'next_auth'
    }
  }
);

export async function POST(req) {
  let filePath = '';

  try {
    const formData = await req.formData();
    const donorId = formData.get('donorId');
    const pdfFile = formData.get('file');

    if (!donorId || !pdfFile) {
      return NextResponse.json(
        { message: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Fetch donor details
    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .select('phone')
      .eq('id', donorId)
      .single();

    if (donorError) {
      console.error('Donor query error:', donorError);
      return NextResponse.json(
        { message: `Failed to fetch donor: ${donorError.message}` },
        { status: 500 }
      );
    }

    if (!donor?.phone) {
      return NextResponse.json(
        { message: 'Donor phone number not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const uniqueFilename = `receipt_${Date.now()}_${pdfFile.name}`;
    filePath = `receipts/${uniqueFilename}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('Donor')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Donor')
      .getPublicUrl(filePath);

    // Send to messaging API
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
      throw new Error(`Message API failed: ${messageResponse.status}`);
    }

    // Cleanup: Delete from storage
    await supabase.storage.from('Donor').remove([filePath]);

    return NextResponse.json({ 
      message: "Receipt sent successfully",
      response: await messageResponse.json()
    });

  } catch (error) {
    console.error("Error:", error);
    
    // Cleanup on error
    if (filePath) {
      await supabase.storage.from('Donor').remove([filePath]);
    }

    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}