import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TokenPieChartProps {
    data: Record<string, number>;
}

const COLORS = ['#ffffff', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.15)'];

const TokenPieChart = ({ data }: TokenPieChartProps) => {
    const chartData = Object.entries(data)
        .filter(([, count]) => count > 0)
        .map(([name, value]) => ({
            name: name.toUpperCase(),
            value,
        }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-500">
                No token data yet
            </div>
        );
    }

    return (
        <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                        }}
                    />
                    <Legend
                        formatter={(value: string) => <span className="text-gray-300 text-sm">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TokenPieChart;
