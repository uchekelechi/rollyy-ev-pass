const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

// Future contract: POST /settlement {sessionId} -> {receiptUrl}
// Demo version builds a downloadable data: URL CSV receipt in-browser (no backend).
export async function settleSession({ booking, session }) {
  await delay();
  const rows = [
    ['Field', 'Value'],
    ['Booking ID', booking.bookingId],
    ['Station', booking.stationName],
    ['kWh Delivered', session.kWh],
    ['Duration (s)', session.elapsedSeconds],
    ['Total Charged', `$${booking.price}`],
    ['Settled At', new Date().toISOString()]
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const receiptUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return {
    receiptId: `rcpt_${Date.now()}`,
    receiptUrl,
    csv
  };
}
