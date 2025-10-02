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

// Replace static styles with computed sizes for A4 and requested margins/gaps
const CM_TO_PT = 28.3464567; // 1 cm in PDF points
const TOP_BOTTOM_CM = 1.2;
const LEFT_RIGHT_CM = 0.5;
const COL_GAP_CM = 0.3;

const topBottom = TOP_BOTTOM_CM * CM_TO_PT; // ~34.02pt
const leftRight = LEFT_RIGHT_CM * CM_TO_PT; // ~14.17pt
const colGap = COL_GAP_CM * CM_TO_PT; // ~8.50pt

const A4 = { width: 595.28, height: 841.89 }; // pts (approx)
const innerWidth = A4.width - leftRight * 2;
const totalColGaps = colGap * 2; // two gaps between three columns
const colWidth = (innerWidth - totalColGaps) / 3;
const rowHeight = (A4.height - topBottom * 2) / 8; // 8 rows per page

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: topBottom,
    paddingBottom: topBottom,
    paddingLeft: leftRight,
    paddingRight: leftRight,
    fontFamily: 'Roboto',
  },
  rowsContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    height: rowHeight,
    marginBottom: 0, // no vertical gaps between rows
    padding: 0, // ensure no extra padding
    alignItems: 'stretch',
  },
  col: {
    width: colWidth,
    marginRight: colGap,
    padding: 0,
  },
  colLast: {
    marginRight: 0,
  },
  sticker: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 6,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  stickerText: {
    fontSize: 10,
  },
});

const PrintPage = () => {
    const [addresses, setAddresses] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchAddresses = async () => {
            // Get the URL search params
            const params = new URLSearchParams(window.location.search);
            
            // Build the query
            let query = supabase
                .from('donors')
                .select('*')
                .order('donor_number', { ascending: true });

            // Apply filters from URL params
            if (params.get('startDate')) {
                query = query.gte('created_at', params.get('startDate'));
            }
            if (params.get('endDate')) {
                query = query.lte('created_at', params.get('endDate'));
            }
            if (params.get('donorName')) {
                query = query.or(`donor_name.ilike.%${params.get('donorName')}%,contact_person.ilike.%${params.get('donorName')}%`);
            }
            if (params.get('city')) {
                query = query.ilike('city', `%${params.get('city')}%`);
            }
            if (params.get('state')) {
                query = query.ilike('state', `%${params.get('state')}%`);
            }
            if (params.get('donorType')) {
                query = query.eq('donor_type', params.get('donorType'));
            }
            if (params.get('donorSource')) {
                query = query.eq('donor_source', params.get('donorSource'));
            }
            if (params.get('donorZone')) {
                query = query.eq('donor_zone', params.get('donorZone'));
            }
            if (params.get('representative')) {
                query = query.eq('representative', params.get('representative'));
            }

            const { data, error } = await query;

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
        if (!donor) return '';
        return `${donor.institution_name ? donor.institution_name : donor.donor_name}
${donor.street_name ? donor.street_name + ', ' : ''}${donor.area_name || ''}
${donor.landmark ? donor.landmark + ', ' : ''}${donor.city || ''}
${donor.state || ''}${donor.country ? ', ' + donor.country : ''}${donor.pincode ? ' - ' + donor.pincode : ''}`.trim();
    };

    const chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    const AddressDocument = ({ addresses }) => (
        <Document>
            {chunk(addresses, 24).map((pageAddresses, pageIndex) => {
                // Ensure exactly 24 slots per page (8 rows x 3 cols)
                const padded = Array.from({ length: 24 }, (_, i) => pageAddresses[i] || null);
                const rows = chunk(padded, 3); // 8 rows
                return (
                    // use the exact A4 point dimensions calculated above for precise layout
                    <Page key={pageIndex} size={[A4.width, A4.height]} style={styles.page}>
                        <View style={styles.rowsContainer}>
                            {rows.map((rowAddresses, rowIndex) => (
                                <View key={rowIndex} style={styles.row}>
                                    {rowAddresses.map((donor, cellIndex) => {
                                        const isLast = cellIndex === 2;
                                        return (
                                            <View
                                                key={cellIndex}
                                                style={[styles.col, isLast && styles.colLast]}
                                            >
                                                <View style={styles.sticker}>
                                                    <Text style={styles.stickerText}>{formatAddress(donor)}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </Page>
                );
            })}
        </Document>
    );

    const generatePDF = async (addressData) => {
        const blob = await pdf(<AddressDocument addresses={addressData} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    return (
        <div className="text-gray-800 flex items-center justify-center h-screen">
            <p>Generating PDF, please wait...</p>
        </div>
    );
};

export default PrintPage;
