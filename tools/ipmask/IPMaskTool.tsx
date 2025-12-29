"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";

interface Subnet {
  id: string;
  network: string;
  cidr: string;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  totalIPs: number;
  usableIPs: number;
  networkClass: string;
  timestamp: number;
}

interface Conflict {
  subnet1: string;
  subnet2: string;
  type: "overlap" | "contains";
}

export default function IPMaskTool({}: ToolProps) {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [networkInput, setNetworkInput] = useState("");
  const [cidrInput, setCidrInput] = useState("");
  const [deviceCount, setDeviceCount] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Parse IP address to number
  const ipToNumber = (ip: string): number | null => {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return null;
    }
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  };

  // Convert number to IP address
  const numberToIP = (num: number): string => {
    return `${(num >>> 24) & 255}.${(num >>> 16) & 255}.${(num >>> 8) & 255}.${num & 255}`;
  };

  // Get network class
  const getNetworkClass = (ip: string): string => {
    const num = ipToNumber(ip);
    if (num === null) return "Invalid";
    const firstOctet = (num >>> 24) & 255;
    if (firstOctet >= 1 && firstOctet <= 126) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    if (firstOctet >= 240 && firstOctet <= 255) return "E (Reserved)";
    return "Invalid";
  };

  // CIDR to subnet mask
  const cidrToSubnetMask = (cidr: number): string => {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return numberToIP(mask);
  };

  // Calculate subnet information
  const calculateSubnet = (network: string, cidr: number): Subnet | null => {
    const networkNum = ipToNumber(network);
    if (networkNum === null || cidr < 0 || cidr > 32) return null;

    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    const networkAddressNum = (networkNum & mask) >>> 0;
    const broadcastAddressNum = (networkAddressNum | (~mask >>> 0)) >>> 0;
    const totalIPs = Math.pow(2, 32 - cidr);
    const usableIPs = Math.max(0, totalIPs - 2);

    const networkAddress = numberToIP(networkAddressNum);
    const broadcastAddress = numberToIP(broadcastAddressNum);
    const firstUsableNum = networkAddressNum + 1;
    const lastUsableNum = broadcastAddressNum - 1;

    return {
      id: `${network}/${cidr}`,
      network,
      cidr: `/${cidr}`,
      subnetMask: cidrToSubnetMask(cidr),
      networkAddress,
      broadcastAddress,
      firstUsable: firstUsableNum <= lastUsableNum ? numberToIP(firstUsableNum) : networkAddress,
      lastUsable: firstUsableNum <= lastUsableNum ? numberToIP(lastUsableNum) : networkAddress,
      totalIPs,
      usableIPs,
      networkClass: getNetworkClass(network),
      timestamp: Date.now(),
    };
  };

  // Check if two subnets conflict
  const checkConflict = (subnet1: Subnet, subnet2: Subnet): Conflict | null => {
    const net1 = ipToNumber(subnet1.networkAddress);
    const broad1 = ipToNumber(subnet1.broadcastAddress);
    const net2 = ipToNumber(subnet2.networkAddress);
    const broad2 = ipToNumber(subnet2.broadcastAddress);

    if (net1 === null || broad1 === null || net2 === null || broad2 === null) return null;

    // Check if subnet1 contains subnet2
    if (net1 <= net2 && broad1 >= broad2) {
      if (net1 === net2 && broad1 === broad2) return null; // Same subnet, not a conflict
      return { subnet1: subnet1.id, subnet2: subnet2.id, type: "contains" };
    }

    // Check if subnet2 contains subnet1
    if (net2 <= net1 && broad2 >= broad1) {
      return { subnet1: subnet2.id, subnet2: subnet1.id, type: "contains" };
    }

    // Check for overlap
    if ((net1 <= net2 && broad1 >= net2) || (net2 <= net1 && broad2 >= net1)) {
      return { subnet1: subnet1.id, subnet2: subnet2.id, type: "overlap" };
    }

    return null;
  };

  // Find all conflicts
  const findConflicts = (subnetList: Subnet[]): Conflict[] => {
    const foundConflicts: Conflict[] = [];
    for (let i = 0; i < subnetList.length; i++) {
      for (let j = i + 1; j < subnetList.length; j++) {
        const conflict = checkConflict(subnetList[i], subnetList[j]);
        if (conflict) {
          foundConflicts.push(conflict);
        }
      }
    }
    return foundConflicts;
  };

  // Get conflicts for a specific subnet
  const getSubnetConflicts = (subnetId: string): Conflict[] => {
    return conflicts.filter((c) => c.subnet1 === subnetId || c.subnet2 === subnetId);
  };

  // Sort subnets reverse chronologically (newest first)
  const sortedSubnets = [...subnets].sort((a, b) => b.timestamp - a.timestamp);

  // Generate optimal subnet mask for device count
  const generateOptimalSubnet = (deviceCount: number, existingSubnets: Subnet[]): Subnet | null => {
    if (deviceCount < 1) return null;

    // Calculate minimum CIDR needed (accounting for network and broadcast addresses)
    const neededIPs = deviceCount + 2; // +2 for network and broadcast
    let cidr = 32;
    while (cidr >= 0) {
      const totalIPs = Math.pow(2, 32 - cidr);
      if (totalIPs >= neededIPs) {
        break;
      }
      cidr--;
    }

    if (cidr < 0) return null; // Too many devices

    // Try to find a non-conflicting network
    // Start with common private IP ranges
    const privateRanges = [
      { network: "10.0.0.0", maxCidr: 8 },
      { network: "172.16.0.0", maxCidr: 12 },
      { network: "192.168.0.0", maxCidr: 16 },
    ];

    for (const range of privateRanges) {
      const rangeNum = ipToNumber(range.network);
      if (rangeNum === null) continue;

      const rangeCidr = range.maxCidr;
      const rangeSize = Math.pow(2, 32 - rangeCidr);
      const subnetSize = Math.pow(2, 32 - cidr);
      const maxSubnets = Math.floor(rangeSize / subnetSize);

      // Limit search to first 1000 subnets to avoid performance issues
      const searchLimit = Math.min(maxSubnets, 1000);

      // Try different network addresses within the range
      for (let i = 0; i < searchLimit; i++) {
        const offset = i * subnetSize;
        const testNetworkNum = (rangeNum + offset) >>> 0;
        
        // Make sure we're still within the range
        const rangeMask = (0xffffffff << (32 - rangeCidr)) >>> 0;
        if ((testNetworkNum & rangeMask) !== (rangeNum & rangeMask)) {
          break; // We've gone outside the range
        }

        const testNetwork = numberToIP(testNetworkNum);
        const testSubnet = calculateSubnet(testNetwork, cidr);

        if (!testSubnet) continue;

        // Check if this subnet conflicts with existing ones
        let hasConflict = false;
        for (const existing of existingSubnets) {
          const conflict = checkConflict(testSubnet, existing);
          if (conflict) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          return testSubnet;
        }
      }
    }

    return null;
  };

  // Add subnet
  const handleAddSubnet = () => {
    if (!networkInput || !cidrInput) {
      alert("Please enter both network address and CIDR notation");
      return;
    }

    const cidr = parseInt(cidrInput);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) {
      alert("CIDR must be between 0 and 32");
      return;
    }

    const subnet = calculateSubnet(networkInput, cidr);
    if (!subnet) {
      alert("Invalid network address or CIDR");
      return;
    }

    setSubnets([...subnets, subnet]);
    setNetworkInput("");
    setCidrInput("");

    // Check for conflicts
    const newSubnets = [...subnets, subnet];
    setConflicts(findConflicts(newSubnets));
  };

  // Remove subnet
  const handleRemoveSubnet = (id: string) => {
    const newSubnets = subnets.filter((s) => s.id !== id);
    setSubnets(newSubnets);
    setConflicts(findConflicts(newSubnets));
  };

  // Generate subnet for device count
  const handleGenerateSubnet = () => {
    const count = parseInt(deviceCount);
    if (isNaN(count) || count < 1) {
      alert("Please enter a valid device count (at least 1)");
      return;
    }

    const optimalSubnet = generateOptimalSubnet(count, subnets);
    if (!optimalSubnet) {
      alert("Could not generate a subnet. Try with fewer devices or remove some existing subnets.");
      return;
    }

    setSubnets([...subnets, optimalSubnet]);
    setDeviceCount("");
    setConflicts(findConflicts([...subnets, optimalSubnet]));
  };

  return (
    <div className="flex flex-col h-full min-h-screen p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        IP Masking Calculator
      </h1>

      <div className="flex flex-col gap-3">
        {/* Input Sections - Side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Manual Subnet Addition */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add Subnet Manually</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Network + CIDR</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Network Address
                </label>
                <input
                  type="text"
                  value={networkInput}
                  onChange={(e) => setNetworkInput(e.target.value)}
                  placeholder="192.168.1.0"
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CIDR Notation
                </label>
                <input
                  type="text"
                  value={cidrInput}
                  onChange={(e) => setCidrInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="24"
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddSubnet}
                  className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Subnet
                </button>
              </div>
            </div>
          </div>

          {/* Auto Generate Subnet */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Generate Subnet</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Auto-calculate from device count</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Devices
                  </label>
                  <input
                    type="text"
                    value={deviceCount}
                    onChange={(e) => setDeviceCount(e.target.value.replace(/\D/g, ""))}
                    placeholder="50"
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateSubnet}
                    className="w-full px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Generate Subnet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conflicts Banner */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-300 dark:border-red-700">
            <div className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
              ⚠️ {conflicts.length} Conflict{conflicts.length !== 1 ? "s" : ""} Detected
            </div>
            <div className="text-xs text-red-800 dark:text-red-200 space-y-0.5">
              {conflicts.slice(0, 3).map((conflict, idx) => (
                <div key={idx}>
                  <span className="font-mono">{conflict.subnet1}</span>{" "}
                  {conflict.type === "contains" ? "⊃" : "∩"}{" "}
                  <span className="font-mono">{conflict.subnet2}</span>
                </div>
              ))}
              {conflicts.length > 3 && (
                <div className="text-red-600 dark:text-red-300">+{conflicts.length - 3} more...</div>
              )}
            </div>
          </div>
        )}

        {/* Subnets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <div className="p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Subnets ({subnets.length})
            </h2>
          </div>
          {subnets.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              No subnets added yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Network</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Class</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Mask</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Network Addr</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Broadcast</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">Range</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-gray-700 dark:text-gray-300">Total IPs</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-gray-700 dark:text-gray-300">Usable</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedSubnets.map((subnet) => {
                    const subnetConflicts = getSubnetConflicts(subnet.id);
                    return (
                      <tr
                        key={subnet.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900 ${
                          subnetConflicts.length > 0 ? "bg-red-50 dark:bg-red-900/10" : ""
                        }`}
                      >
                        <td className="px-2 py-1.5">
                          <div className="font-mono text-gray-900 dark:text-gray-100">
                            {subnet.network}
                            {subnet.cidr}
                          </div>
                          {subnetConflicts.length > 0 && (
                            <div className="text-red-600 dark:text-red-400 text-[10px] mt-0.5">
                              ⚠ {subnetConflicts.length}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">
                          {subnet.networkClass}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">
                          {subnet.subnetMask}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">
                          {subnet.networkAddress}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">
                          {subnet.broadcastAddress}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-gray-600 dark:text-gray-400">
                          {subnet.firstUsable} - {subnet.lastUsable}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-700 dark:text-gray-300">
                          {subnet.totalIPs.toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {subnet.usableIPs.toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => handleRemoveSubnet(subnet.id)}
                            className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Remove subnet"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

