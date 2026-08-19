import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { VolumeDataPoint } from '../../hooks/useAnalytics';

interface VolumeChartProps {
    data: VolumeDataPoint[];
}

const VolumeChart = ({ data }: VolumeChartProps) => {
    const formatted = data.map(d => ({
        ...d,
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    return (
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="label"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={false}
                        name="Total"
                    />
                    <Line
                        type="monotone"
                        dataKey="settled"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        name="Settled"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VolumeChart;
