import {
  BookText,
  Cpu,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Landmark,
  Languages,
  Layout,
  Lightbulb,
  Moon,
  Package,
  Rocket,
  TrendingUp,
  User,
} from 'lucide-react';
import type { ReactNode } from 'react';

export const BOOK_CATEGORY_ICON: Record<string, ReactNode> = {
  IT: <Cpu className="size-5" strokeWidth={1.5} />,
  'UX/UI': <Layout className="size-5" strokeWidth={1.5} />,
  '마케팅/비즈니스': <TrendingUp className="size-5" strokeWidth={1.5} />,
  역사: <Landmark className="size-5" strokeWidth={1.5} />,
  '신화/종교/판타지': <Moon className="size-5" strokeWidth={1.5} />,
  문학: <BookText className="size-5" strokeWidth={1.5} />,
  '우주/과학': <Rocket className="size-5" strokeWidth={1.5} />,
  '인문/사회/철학': <GraduationCap className="size-5" strokeWidth={1.5} />,
  '화집/설정집': <ImageIcon className="size-5" strokeWidth={1.5} aria-hidden />,
  관심사: <Heart className="size-5" strokeWidth={1.5} />,
  '교제/어학': <Languages className="size-5" strokeWidth={1.5} />,
  '에세이/자기계발': <Lightbulb className="size-5" strokeWidth={1.5} />,
  인물: <User className="size-5" strokeWidth={1.5} />,
  기타: <Package className="size-5" strokeWidth={1.5} />,
};
