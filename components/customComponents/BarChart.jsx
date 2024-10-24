"use client"

import * as React from "react"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const COLORS = [
  '#6C665F',
  '#A67B5B',
  '#F3E6D5',
  '#A79277',
  '#D8AE7E',
  '#FDF0D1',
  '#BBAB8C',
  '#EAC696',
  '#DAB88B'
  // Add more colors if needed
];

const  BarChart = ({ data, title, description }) =>  {
  const purposes = [...new Set(data.flatMap(item => Object.keys(item.purposes)))];
  
  const chartConfig = purposes.reduce((config, purpose, index) => {
    config[purpose] = {
      label: purpose,
      color: COLORS[index % COLORS.length],
    };
    return config;
  }, {});

  const barData = purposes.map((purpose, index) => ({
    name: purpose,
    value: data.reduce((sum, item) => sum + (item.purposes[purpose] || 0), 0),
    fill: COLORS[index % COLORS.length],
  }));

  const totalDonations = React.useMemo(() => {
    return barData.reduce((acc, curr) => acc + curr.value, 0)
  }, [barData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart accessibilityLayer data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip
              cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar 
                dataKey="value" 
                fill="#000000"
                // Add these properties to remove the hover effect
                isAnimationActive={false}
                activeBar={false}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
        {/* <div className="mt-4 text-center">
          <p className="text-2xl font-bold">₹{totalDonations.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Donations</p>
        </div> */}
      </CardContent>
    </Card>
  )
}

export default BarChart;