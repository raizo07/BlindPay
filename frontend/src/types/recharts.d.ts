// Fix recharts class component compatibility with React 19 types
declare module 'recharts' {
    export const LineChart: any;
    export const Line: any;
    export const XAxis: any;
    export const YAxis: any;
    export const CartesianGrid: any;
    export const Tooltip: any;
    export const ResponsiveContainer: any;
    export const PieChart: any;
    export const Pie: any;
    export const Cell: any;
    export const Legend: any;
}
