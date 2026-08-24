import ProductFormPage from '../../ProductFormPage';

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <ProductFormPage productId={id} />;
}
