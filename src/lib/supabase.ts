import { supabase } from "@/integrations/supabase/client";

export { supabase };

export async function createOrder(orderData: any, items: any[]) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([orderData])
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.id.startsWith("p") ? null : item.id,
    seller_id: item.vendor_id || item.seller_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  return order;
}

export async function uploadProductImage(file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function loginWithEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function syncCartToDB(userId: string, items: any[]) {
  await supabase.from("cart_items").delete().eq("user_id", userId);

  if (items.length === 0) return;

  const dbItems = items
    .map((i) => ({
      user_id: userId,
      product_id: i.id.startsWith("p") ? null : i.id,
      quantity: i.quantity,
    }))
    .filter((i) => i.product_id !== null);

  if (dbItems.length > 0) {
    await supabase.from("cart_items").insert(dbItems);
  }
}
