import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import CheckInSheet from "./CheckInSheet";
import { useAppStore } from "@/store/useAppStore";

const AppLayout = () => {
  const { isCheckinOpen, setCheckinOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      <div className="flex-1 min-h-screen relative">
        {/* Mobile header only */}
        <div className="md:hidden">
          <AppHeader />
        </div>
        <main className="pt-14 md:pt-6 pb-20 md:pb-6 px-4 sm:px-6 md:px-10 lg:px-12 max-w-5xl md:mx-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      {/* Global CheckIn Sheet */}
      <CheckInSheet open={isCheckinOpen} onOpenChange={setCheckinOpen} />
    </div>
  );
};

export default AppLayout;
