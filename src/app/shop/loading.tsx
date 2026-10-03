export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 bg-[#F5F5F5] rounded-md mb-8 animate-pulse" />
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="border border-[#E5E5E5] rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-[#F5F5F5]" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-24 bg-[#F5F5F5] rounded" />
              <div className="h-4 w-full bg-[#F5F5F5] rounded" />
              <div className="h-4 w-2/3 bg-[#F5F5F5] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
