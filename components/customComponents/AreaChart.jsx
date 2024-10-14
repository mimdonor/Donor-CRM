"use client"

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

const AreaChart = ({ data, title, description, dataKeys, xAxisKey }) => {
  const chartConfig = dataKeys.reduce((config, dataKey) => {
    config[dataKey.key] = {
      label: dataKey.label,
      color: dataKey.color,
    }
    return config
  }, {}) 

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              {/* <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" /> */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              {dataKeys.map((dataKey, index) => (
                <Area
                  key={index}
                  yAxisId={index === 0 ? "left" : "right"}
                  type="monotone"
                  dataKey={dataKey.key}
                  fill={dataKey.color}
                  fillOpacity={0.3}
                  stroke={dataKey.color}
                  strokeWidth={2}
                />
              ))}
            </RechartsAreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default AreaChart
