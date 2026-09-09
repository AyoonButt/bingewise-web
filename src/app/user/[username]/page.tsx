import type { Metadata } from "next";
import { fetchUserForRender } from "@/lib/user-server";
import UserProfileClient from "./user-profile-client";

const BASE_URL = "https://www.bingewise.net";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await fetchUserForRender(params.username);

  if (!user) {
    return { title: "User Not Found" };
  }

  const description = `Check out ${user.name}'s profile on BingeWise. See their preferences, watchlists, and recommended TV shows and movies.`;
  const url = `${BASE_URL}/user/${user.username}`;

  return {
    title: `${user.name} (@${user.username})`,
    description,
    openGraph: {
      title: `${user.name} on BingeWise`,
      description,
      url,
      siteName: "BingeWise",
      type: "profile",
      images: [
        {
          url: `https://api.dicebear.com/7.x/bottts/png?seed=user${user.userId}&size=600`,
          width: 600,
          height: 600,
          alt: user.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${user.name} on BingeWise`,
      description,
      images: [`https://api.dicebear.com/7.x/bottts/png?seed=user${user.userId}&size=600`],
    },
    alternates: { canonical: url },
  };
}

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  const user = await fetchUserForRender(params.username);

  return <UserProfileClient initialUser={user} />;
}
