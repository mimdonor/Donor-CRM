"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

// Register a font (optional, but can improve text rendering)
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 10,
    fontFamily: 'Roboto',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
});

const PrintPage = () => {
    const [addresses, setAddresses] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchAddresses = async () => {
            const { data, error } = await supabase
                .from('donors')
                .select('*')
                .order('donor_number', { ascending: true });

            if (error) {
                console.error('Error fetching addresses:', error);
            } else {
                setAddresses(data);
                generatePDF(data);
            }
        };

        fetchAddresses();
    }, []);

    const formatAddress = (donor) => {
        return `${donor.donor_name}
${donor.street_name}, ${donor.area_name}
${donor.landmark ? donor.landmark + ', ' : ''}${donor.city}
${donor.state}, ${donor.country} - ${donor.pincode}`;
    };

    const AddressDocument = ({ addresses }) => (
        <Document>
            {chunk(addresses, 21).map((pageAddresses, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page}>
                    <View style={styles.table}>
                        {chunk(pageAddresses, 3).map((rowAddresses, rowIndex) => (
                            <View key={rowIndex} style={styles.tableRow}>
                                {rowAddresses.map((donor, cellIndex) => (
                                    <View key={cellIndex} style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{formatAddress(donor)}</Text>
                                    </View>
                                ))}
                                {rowAddresses.length < 3 && Array(3 - rowAddresses.length).fill().map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.tableCol}>
                                        <Text style={styles.tableCell}></Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </Page>
            ))}
        </Document>
    );

    const generatePDF = async (addressData) => {
        const blob = await pdf(<AddressDocument addresses={addressData} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // Utility function to chunk array into smaller arrays
    const chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    return (
        <div className="text-gray-800 flex items-center justify-center h-screen">
            <p>Generating PDF, please wait...</p>
        </div>
    );
};

export default PrintPage;
