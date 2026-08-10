export default function ProductDetailLoading() {
  return (
    <main className="max-w-container-max mx-auto w-full min-w-0 px-margin-mobile md:px-margin-desktop py-8 animate-pulse">
      <div className="h-4 bg-outline-variant/20 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="aspect-square bg-outline-variant/20 rounded-2xl" />
        <div className="space-y-6">
          <div className="h-6 bg-outline-variant/20 rounded w-1/3" />
          <div className="h-10 bg-outline-variant/20 rounded w-3/4" />
          <div className="h-5 bg-outline-variant/20 rounded w-1/2" />
          <div className="h-16 bg-outline-variant/20 rounded-xl w-full" />
          <div className="h-12 bg-outline-variant/20 rounded-lg w-full" />
          <div className="h-12 bg-outline-variant/20 rounded-lg w-full" />
        </div>
      </div>
    </main>
  );
}
