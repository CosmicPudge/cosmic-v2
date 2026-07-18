export interface SchoolCanvasConnection {
  status: "notConnected";
  message: string;
}

export function getSchoolCanvasConnection(): SchoolCanvasConnection {
  return {
    status: "notConnected",
    message: "Canvas integration is not connected in the School overview mock data.",
  };
}
