export type Category = {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  image: string | null;
  order: number;
  isFeatured: boolean;
  children: Category[];
};
