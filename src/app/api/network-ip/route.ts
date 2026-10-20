import { NextResponse } from 'next/server';
import os from 'os';


export async function GET() {
  const interfaces = os.networkInterfaces();
  const ips: { name: string; ip: string }[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      // Find non-internal IPv4 addresses
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push({ name, ip: addr.address });
      }
    }
  }

  // Prioritize Wi-Fi or wireless interfaces
  const primary =
    ips.find((i) => /wi-fi|wireless|wlan/i.test(i.name)) ||
    ips.find((i) => /ethernet|eth/i.test(i.name)) ||
    ips[0] || { name: 'fallback', ip: '10.254.84.8' };

  const port = process.env.PORT || '3000';

  return NextResponse.json({
    ip: primary.ip,
    port: Number(port),
    url: `http://${primary.ip}:${port}`,
    interfaces: ips,
  });
}
