import MapView from "@/Layouts/MapView";

export default function Test() {
  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-2xl font-bold p-4 bg-gray-100 border-b">Peta GIS</h1>
      <div className="flex-1">
        <MapView />
      </div>
    </div>
  );
}