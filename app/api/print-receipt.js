import { NextResponse } from "next/server";
import formidable from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseTable = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let filePath = '';

  try {
    const form = formidable();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const { donorId } = fields;
    const pdfFile = files.file[0];  // Access the first file in the array

    if (!donorId || !pdfFile) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch the donor's phone number from the donor table
    const { data: donor, error: donorError } = await supabaseTable
      .from('donors')
      .select('phone')
      .eq('id', donorId)
      .single();

    if (donorError) {
      throw new Error(`Failed to fetch donor information: ${donorError.message}`);
    }

    if (!donor || !donor.phone) {
      throw new Error('Donor phone number not found');
    }

    const phoneNumber = donor.phone;

    // Read the PDF file
    const fileContent = fs.readFileSync(pdfFile.filepath);

    // Generate a unique filename
    const uniqueFilename = `receipt_${Date.now()}_${pdfFile.originalFilename}`;
    filePath = `receipts/${uniqueFilename}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('Donor')
      .upload(filePath, fileContent, {
        contentType: 'application/pdf',
      });

    if (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }

    // Get public URL of the uploaded file
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('Donor')
      .getPublicUrl(filePath);

    if (urlError) {
      throw new Error(`Failed to get public URL: ${urlError.message}`);
    }

    // Prepare the message
    const message = `Thank you for your contribution!`;

    // Prepare the form data for the API request
    const formData = new URLSearchParams();
    formData.append('appkey', '32bd1ea1-1104-447d-addd-caba38916b50');
    formData.append('authkey', 'jSvVJO1Lp3u07oDKDESCrDxyBoV7LSZ0UrMCT5t642H15j9YNX');
    formData.append('to', phoneNumber);
    formData.append('message', message);
    formData.append('file', publicUrl);

    // Send the request to the API
    const response = await fetch('https://acs.agoo.in/api/create-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    console.log(formData)

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    // Delete the file from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from('Donor')
      .remove([filePath]);

    if (deleteError) {
      console.error(`Failed to delete file from Supabase: ${deleteError.message}`);
      // We don't throw here as the main operation (sending the receipt) was successful
    }

    // Clean up the temporary file
    fs.unlinkSync(pdfFile.filepath);

    return res.status(200).json({ message: "Receipt sent successfully", response: responseData });
  } catch (error) {
    console.error("Error while sending receipt", error);

    // If there was an error and we uploaded a file, try to delete it
    if (filePath) {
      try {
        await supabase.storage.from('Donor').remove([filePath]);
      } catch (deleteError) {
        console.error(`Failed to delete file after error: ${deleteError.message}`);
      }
    }

    return res.status(500).json({ message: "Error while sending receipt", error: error.message });
  }
}