import React from 'react';
import { PageTitleBlock } from '../shared/PageTitleBlock';
import { FirewallPanel } from './FirewallPanel';
import { TLSHandshake } from './TLSHandshake';
import { DNSResolver } from './DNSResolver';

export function SecurityLab() {
  return (
    <div className="h-full">
      <PageTitleBlock 
        eyebrow="SECURITY & PROTOCOLS" 
        title="Security Lab" 
        subtitle="Experiment with firewalls, TLS handshakes, and DNS resolution." 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FirewallPanel />
        <div className="flex flex-col gap-6">
          <TLSHandshake />
          <DNSResolver />
        </div>
      </div>
    </div>
  );
}
