import Link from "next/link";

export default function Products() {
  const products = [
    { id: 1, name: "iPhone" },
    { id: 2, name: "MacBook" },
    { id: 3, name: "AirPods" },
  ];

  return (
    <main>
      {products.map((product) => (
        <div key={product.id}>
          <h2>{product.name}</h2>

          <Link href={`/products/${product.id}`}>
            View Product
          </Link>
        </div>
      ))}
    </main>
  );
}