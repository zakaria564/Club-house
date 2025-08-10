
"use client"
import * as React from "react"
import { YAxis as RechartsYAxis } from "recharts"

type YAxisProps = React.ComponentProps<typeof RechartsYAxis> & {
  allowDecimals?: boolean;
};

export const YAxis = ({ allowDecimals = true, ...props }: YAxisProps) => (
  <RechartsYAxis allowDecimals={allowDecimals} {...props} />
);
