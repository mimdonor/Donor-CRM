"use client";
import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import SeeshanHeader from "@/public/assets/SeeshanHeader.png";
import MimHeader from "@/public/assets/MIMHeader.png";
import SeeshanFooter from "@/public/assets/SeeshanFooter.png";
import MimFooter from "@/public/assets/MIMFooter.png";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "react-hot-toast";

export default function PrintDonation() {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [receiptData, setReceiptData] = useState(false);
  const [purposes, setPurposes] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [hideCustomMessage, setHideCustomMessage] = useState(false);

  const printRef = useRef(null); // 🔹 Add ref for capturing image

  useEffect(() => {
    fetchDonation();
    fetchPurposes();
  }, [id]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadAsImage = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Receipt-${donation?.receipt_no || "donation"}.png`;
    link.click();
  };

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  async function fetchDonation() {
    try {
      setLoading(true);
      const { data: donationData, error: donationError } = await supabase
        .from("donations")
        .select("*")
        .eq("id", id)
        .single();

      if (donationError) throw donationError;

      if (donationData) {
        const { data: donorData, error: donorError } = await supabase
          .from("donors")
          .select("*")
          .eq("donor_number", donationData.donor_id)
          .single();

        if (donorError) throw donorError;

        setDonation({ ...donationData, donor: donorData });

        const { data: orgData, error: orgError } = await supabase
          .from("organization_settings")
          .select("*")
          .eq("name", donationData.organization)
          .single();

        if (orgError) throw orgError;

        setOrganization(orgData);

        const { data: receiptData } = await supabase
          .from("receipt_message")
          .select("message")
          .single();

        if (receiptData) {
          setReceiptData(receiptData);
        }
      }
    } catch (error) {
      console.error("Error fetching donation:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPurposes() {
    try {
      const { data, error } = await supabase.from("purposes_dropdown").select("*");
      if (error) throw error;
      setPurposes(data);
    } catch (error) {
      console.error("Error fetching purposes:", error);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  };

  const handleSendReceipt = async () => {
    if (!donation || !organization) return;
    setIsSending(true);

    try {
      const response = await fetch("/api/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donorId: donation.donor_id,
          receiptData: {
            organization,
            donation,
            receiptMessage: receiptData.message,
            noCustomMessage: hideCustomMessage,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send receipt");
      }

      toast.success("Receipt sent successfully");
    } catch (error) {
      console.error("Error sending receipt:", error);
      toast.error("Failed to send receipt");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading donation information...</div>;
  }

  if (!donation || !organization) {
    return <div className="text-center">Donation or organization not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Receipt Content */}
      <div ref={printRef} className="bg-white">
        <Card className="relative overflow-hidden">
          <div className="w-full">
            <img
              src={organization.name === "Seeshan" ? SeeshanHeader.src : MimHeader.src}
              alt={`${organization.name} Header`}
              className="w-full h-28 object-cover"
            />
          </div>
          <div className="p-8">
            <div className="w-1/4 text-left">
              <p className="text-sm">
                <strong>Receipt No:</strong> {donation.receipt_no}
              </p>
              <p className="text-sm">
                <strong>Date:</strong> {formatDate(donation.date)}
              </p>
            </div>

            <div className="space-y-4 my-6">
              <div className="flex">
                <p className="w-1/3">
                  <strong>Received From:</strong>
                </p>
                <p className="w-2/3">
                  {donation.donor?.institution_name || donation.donor?.donor_name}
                </p>
              </div>
              <div className="flex">
                <p className="w-1/3">
                  <strong>City:</strong>
                </p>
                <p className="w-2/3">{donation.donor?.city}</p>
              </div>
              <div className="flex">
                <p className="w-1/3">
                  <strong>Towards:</strong>
                </p>
                <p className="w-2/3">{donation.purpose}</p>
              </div>
              <div className="flex">
                <p className="w-1/3">
                  <strong>Amount:</strong>
                </p>
                <p className="w-2/3">Rs. {donation.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-end -mr-16 -mb-10">
              <div className="w-56">
                <p className="text-[10px] text-gray-600 text-left">
                  Signature is not required
                  <br />
                  as the document is to be digitally signed
                </p>
              </div>
            </div>
          </div>
          <div className="w-full">
            <img
              src={organization.name === "Seeshan" ? SeeshanFooter.src : MimFooter.src}
              alt={`${organization.name} Footer`}
              className="w-full h-28 object-cover"
            />
          </div>

          {!hideCustomMessage && (
            <div className="bg-gray-100 p-4 text-center">
              <p
                className="text-sm italic mt-2"
                dangerouslySetInnerHTML={{ __html: receiptData.message }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      {!isPrinting && (
        <div className="flex flex-col gap-4 my-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hideMessage"
              checked={hideCustomMessage}
              onChange={(e) => setHideCustomMessage(e.target.checked)}
              className="rounded"
            />
            <label className="text-black" htmlFor="hideMessage">
              Print without custom message
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-4 print:hidden">
            <Button onClick={handlePrint}>Download as PDF</Button>
            <Button onClick={handleDownloadAsImage}>Download as Image</Button>
            <Button onClick={handleSendReceipt} disabled={isSending}>
              {isSending ? "Sending..." : "Send Receipt"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
