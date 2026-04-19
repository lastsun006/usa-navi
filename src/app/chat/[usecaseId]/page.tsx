import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { getUsecase, USECASES } from "@/lib/usecases";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ usecaseId: string }>;
}

export async function generateStaticParams() {
  return USECASES.map((uc) => ({ usecaseId: uc.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { usecaseId } = await params;
  const usecase = getUsecase(usecaseId);
  if (!usecase) return {};
  return {
    title: `${usecase.title} | USA Navi`,
    description: usecase.subtitle,
  };
}

export default async function ChatPage({ params }: Props) {
  const { usecaseId } = await params;
  const usecase = getUsecase(usecaseId);

  if (!usecase) notFound();

  return <ChatInterface usecase={usecase} />;
}
