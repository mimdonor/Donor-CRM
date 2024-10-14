"use client"

import * as React from "react"
import { PieChart as RechartsPieChart, Pie, Cell, Label, Legend, ResponsiveContainer } from "recharts"
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
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  // Add more colors if needed
];

export function PieChart({ data, title, description }) {
  const purposes = [...new Set(data.flatMap(item => Object.keys(item.purposes)))];
  
  const chartConfig = purposes.reduce((config, purpose, index) => {
    config[purpose] = {
      label: purpose,
      color: COLORS[index % COLORS.length],
    };
    return config;
  }, {});

  const pieData = purposes.map(purpose => ({
    name: purpose,
    value: data.reduce((sum, item) => sum + (item.purposes[purpose] || 0), 0),
  }));

  const totalDonations = React.useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0)
  }, [pieData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            ₹{totalDonations.toFixed(2)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 25}
                            className="fill-muted-foreground text-sm"
                          >
                            Total Donations
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              {/* <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={12} wrapperStyle={{ paddingLeft: 20 }} /> */}
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}