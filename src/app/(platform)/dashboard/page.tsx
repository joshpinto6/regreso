// "use client";

import React from "react";

import { api } from "~/trpc/server";

import { Dashboard } from "../_components/dashboard";

const DashboardHome: React.FC = async () => {
  const { user } = await api.session.get({});
  const { items: workspaces } = await api.workspace.getMany({ limit: 30 });

  return <Dashboard user={user} workspaces={workspaces} />;
};

export default DashboardHome;
