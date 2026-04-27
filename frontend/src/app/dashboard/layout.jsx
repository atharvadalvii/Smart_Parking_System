import { ParkingProvider } from "@/contexts/ParkingContext";

export default function DashboardLayout({ children }) {
  return (
    <ParkingProvider>
      <div className="flex-grow flex flex-col bg-neutral-warm">
        {children}
      </div>
    </ParkingProvider>
  );
}
