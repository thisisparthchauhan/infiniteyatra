import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper: Number to Words (Indian Currency)
const numberToWords = (num) => {
    if (!num) return 'Zero ';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str + 'Only';
};

export const generateInvoicePDF = (booking, payment, customer) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width; // 210mm
    const pageHeight = doc.internal.pageSize.height; // 297mm
    const margin = 12; // Adjusted margin
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Styling Constants
    const primaryColor = [0, 0, 0]; // Black
    const grayColor = [80, 80, 80];
    const borderColor = [0, 0, 0]; // Black borders
    const lightFill = [245, 245, 245]; // Very light gray for backgrounds if needed

    // --- MAIN BORDER ---
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3); // Thinner professional line
    doc.rect(margin, margin, contentWidth, contentHeight);

    let currentY = margin + 10;
    const centerX = pageWidth / 2;

    // --- 1. TITLE ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text("IY INVOICE – BOOKING AMOUNT RECEIVED", centerX, margin + 8, { align: 'center' });

    // --- 2. HEADER SECTION (Logo & Company Info) ---
    // Divider Line below Title
    // doc.line(margin, margin + 12, pageWidth - margin, margin + 12); 

    // Logo Box (Left)
    const logoY = margin + 15;
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(margin + 10, logoY, 60, 16, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INFINITE YATRA", margin + 40, logoY + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.text("EXPLORE INFINITE", margin + 40, logoY + 14, { align: 'center' }); // Tagline

    // Company Info (Right)
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const infoX = pageWidth - margin - 5;
    let infoY = logoY + 2;
    doc.text("Contact Us", infoX, infoY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text("Phone: +91 9265799325", infoX, infoY + 5, { align: 'right' });
    doc.text("Email: infiniteyatra@gmail.com", infoX, infoY + 10, { align: 'right' });

    infoY += 18;
    doc.setFont("helvetica", "bold");
    doc.text("Office Address", infoX, infoY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text("Satellite, Ahmedabad", infoX, infoY + 5, { align: 'right' });
    doc.text("Gujarat – 3800015", infoX, infoY + 10, { align: 'right' });

    currentY = logoY + 36;

    // Header Bottom Border
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // --- 3. BILLING INFO (Split Section) ---
    const billingHeight = 35;
    const midX = pageWidth / 2;

    // Vertical Divider
    doc.line(midX, currentY, midX, currentY + billingHeight);

    // Horizontal Bottom Border for Billing
    doc.line(margin, currentY + billingHeight, pageWidth - margin, currentY + billingHeight);

    // Left: Bill To
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grayColor);
    doc.text("BILL TO", margin + 5, currentY + 6);

    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(customer.name || "Guest", margin + 5, currentY + 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(customer.phone || "", margin + 5, currentY + 20);
    doc.text(customer.email || "", margin + 5, currentY + 26);


    // Right: Invoice Details
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grayColor);
    doc.text("INVOICE DETAILS", infoX, currentY + 6, { align: 'right' });

    const invoiceId = `IY-TR-${booking.id?.slice(0, 4).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString('en-GB');
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let detY = currentY + 14;
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);

    doc.text(`Invoice No: ${invoiceId}`, infoX, detY, { align: 'right' });
    doc.text(`Date: ${dateStr}`, infoX, detY + 6, { align: 'right' });
    doc.text(`Time: ${timeStr}`, infoX, detY + 12, { align: 'right' });

    currentY += billingHeight;

    // --- 4. ITEM TABLE ---
    const totalPrice = Number(booking.totalPrice || 0);
    const discount = 0; // Use static 0 or derived if available
    const amount = totalPrice;
    const bookingAmount = Number(payment.amount || 0);
    const balanceDue = totalPrice - bookingAmount;

    // Table Config
    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        theme: 'grid', // Draws borders
        head: [['#', 'ITEM NAME', 'QTY', 'PRICE / UNIT', 'DISCOUNT', 'AMOUNT']],
        body: [
            ['1', booking.tripName || booking.packageTitle || 'Trip Package', booking.travelers || '1', `Rs ${totalPrice.toLocaleString()}`, `Rs ${discount}`, `Rs ${amount.toLocaleString()}`],
            // Empty rows to fill space if needed, mimicking the template mostly
            ['', '', '', '', '', ''],
            ['', '', '', '', '', '']
        ],
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 6,
            lineColor: borderColor,
            lineWidth: 0.1,
            textColor: primaryColor
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: primaryColor,
            fontStyle: 'bold',
            halign: 'left',
            lineColor: borderColor,
            lineWidth: 0.1
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        didParseCell: (data) => {
            // Uppercase header
            if (data.section === 'head') {
                data.cell.text = data.cell.text[0].toUpperCase();
            }
        }
    });

    currentY = doc.lastAutoTable.finalY;

    // --- 5. SUMMARY & STATUS (Split Section) ---
    // Determine the height of this section approx
    const summaryHeight = 60;

    // Vertical Divider (Same midX)
    doc.line(midX, currentY, midX, currentY + summaryHeight);

    // Horizontal Line after summary
    doc.line(margin, currentY + summaryHeight, pageWidth - margin, currentY + summaryHeight);

    // LEFT: Booking Status Info
    let leftY = currentY + 8;
    const labelX = margin + 5;
    const valueX = midX - 5; // Align value text? No let's do Label : Value

    const addStatusRow = (label, value, color = primaryColor) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(label, labelX, leftY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(value, margin + 40, leftY); // Align value
        leftY += 8;
    };

    // Status Row
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Booking Status:", labelX, leftY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`${booking.status || 'Confirmed'} (Token Received)`, margin + 40, leftY);
    leftY += 8;

    addStatusRow("Tour Departure:", booking.travelDate || "TBD");
    addStatusRow("Route:", `${booking.pickup || 'Dehradun'} - ${booking.drop || 'Dehradun'}`);
    addStatusRow("Payment Mode:", payment.method || "Online");
    addStatusRow("Transaction ID:", payment.id || "N/A");

    // RIGHT: Totals
    let rightY = currentY + 8;
    const rightLabelX = midX + 5;
    const rightValX = pageWidth - margin - 5;

    const addTotalRow = (label, value, isBold = false, color = primaryColor) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(...(isBold ? primaryColor : [100, 100, 100]));
        doc.text(label, rightLabelX, rightY);

        doc.setTextColor(...color);
        doc.text(value, rightValX, rightY, { align: 'right' });
        rightY += 10;
    };

    addTotalRow("Sub Total", `Rs ${totalPrice.toLocaleString()}`);

    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text("Discount / Offer", rightLabelX, rightY);
    doc.text("- Rs 0", rightValX, rightY, { align: 'right' });
    rightY += 10;

    // Dashed line equivalent
    doc.setLineDash([1, 1], 0);
    doc.line(midX + 5, rightY - 5, pageWidth - margin - 5, rightY - 5);
    doc.setLineDash([]); // Reset

    addTotalRow("Total Trip Cost", `Rs ${totalPrice.toLocaleString()}`, true);

    rightY += 4;
    addTotalRow("Token Paid", `Rs ${bookingAmount.toLocaleString()}`, true); // Bold Black usually

    doc.setTextColor(220, 38, 38); // Red
    addTotalRow("Balance Due", `Rs ${balanceDue.toLocaleString()}`, true, [220, 38, 38]);

    currentY += summaryHeight;

    // --- 6. AMOUNT IN WORDS ---
    const wordsHeight = 12;
    doc.line(margin, currentY + wordsHeight, pageWidth - margin, currentY + wordsHeight);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryColor);
    doc.text("Invoice Amount in Words:", margin + 5, currentY + 8);
    doc.setFont("helvetica", "bold");
    doc.text(`${numberToWords(bookingAmount)} Rupees`, margin + 55, currentY + 8);

    currentY += wordsHeight;

    // --- 7. BOTTOM SECTION (Desc & Terms) - Split ---
    const bottomHeight = contentHeight - (currentY - margin) - 40; // Fill remaining space leaving room for footer
    // Let's create a fixed height box for terms
    const termsBoxHeight = 80;

    doc.line(midX, currentY, midX, currentY + termsBoxHeight);
    doc.line(margin, currentY + termsBoxHeight, pageWidth - margin, currentY + termsBoxHeight);

    // Left: Traveler Description
    let descY = currentY + 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("TRAVELER DESCRIPTION", margin + 5, descY);

    descY += 8;
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(`Tourist Age: ${customer.age || 'N/A'} Years`, margin + 5, descY);
    descY += 5;
    doc.text(`Gender: ${customer.gender || 'N/A'}`, margin + 5, descY);

    descY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Emergency Contact:", margin + 5, descY);
    doc.setFont("helvetica", "normal");
    descY += 5;
    doc.text(`${customer.emergencyContact || 'N/A'}`, margin + 5, descY);

    descY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Address:", margin + 5, descY);
    doc.setFont("helvetica", "normal");
    descY += 5;
    const splitAddr = doc.splitTextToSize(customer.address || "N/A", midX - margin - 10);
    doc.text(splitAddr, margin + 5, descY);


    // Right: Terms
    let termsY = currentY + 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("TERMS & CONDITIONS", rightLabelX, termsY);

    termsY += 8;
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    const termsText = [
        "1. Booking / Token amount is NON-REFUNDABLE & Non-Transferable.",
        "2. Remaining balance must be cleared at least 7 days before departure.",
        "3. Trip schedule is subject to change due to weather or safety conditions.",
        "4. Infinite Yatra reserves the right to cancel or modify elements of the itinerary if necessary.",
        "5. Participants must carry valid Government ID proof."
    ];

    termsText.forEach(term => {
        const lines = doc.splitTextToSize(term, (pageWidth - midX) - 10);
        doc.text(lines, rightLabelX, termsY);
        termsY += (lines.length * 4) + 2;
    });

    currentY += termsBoxHeight;

    // --- 8. FOOTER ---
    const footerY = currentY;

    // Thank you text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Infinite Yatra", margin + 5, footerY + 12);

    // Socials
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const socY = footerY + 20;
    doc.text("infinite.yatra", margin + 10, socY); // Add icons if possible, simpler to use text for now
    doc.text("Infinite Yatra (WhatsApp)", margin + 10, socY + 5);
    doc.text("infiniteyatra@gmail.com", margin + 10, socY + 10);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Explore Infinite", margin + 10, socY + 16);

    // Signature (Right)
    doc.setFontSize(16);
    doc.setFont("times", "italic"); // simple subtitle for signature
    doc.setTextColor(...primaryColor);
    doc.text("InfiniteYatra", pageWidth - margin - 10, footerY + 25, { align: 'right' });

    doc.setDrawColor(...borderColor);
    doc.line(pageWidth - margin - 50, footerY + 28, pageWidth - margin, footerY + 28);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", pageWidth - margin - 5, footerY + 33, { align: 'right' });

    return doc;
};
