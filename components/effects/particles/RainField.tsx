"use client";

interface Props {
    drops?: number;
}

const particles = [
    { x: 28, delay: 0.0, length: 12 },
    { x: 38, delay: 0.2, length: 14 },
    { x: 48, delay: 0.45, length: 11 },
    { x: 58, delay: 0.7, length: 13 },
    { x: 68, delay: 0.15, length: 12 },
    { x: 78, delay: 0.55, length: 15 },
];

export default function RainField({
    drops = 6,
}: Props) {
    return (
        <g>
            {particles.slice(0, drops).map((drop, index) => (
                <line
                    key={index}
                    x1={drop.x}
                    y1={58}
                    x2={drop.x + 2}
                    y2={58 + drop.length}
                    className="cosmic-rain"
                    style={{
                        animationDelay: `${drop.delay}s`,
                    }}
                />
            ))}
        </g>
    );
}