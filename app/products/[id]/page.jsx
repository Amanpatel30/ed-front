export default async function ProductPage({ params }) {
  const { id } = await params;

  return (
    <main>
      <h1>Product Details</h1>
      <p>Product ID: {id}</p>
    </main>
  );
}