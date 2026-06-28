export const chartDefaults = (isDark) => ({
  gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  textColor: isDark ? '#9ca3af' : '#6b7280',
  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
});

export const lineOptions = (isDark, title) => {
  const d = chartDefaults(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: d.textColor, usePointStyle: true, padding: 16 } },
      title: { display: !!title, text: title, color: d.textColor, font: { size: 14, weight: '500' } }
    },
    scales: {
      x: { grid: { color: d.gridColor }, ticks: { color: d.textColor } },
      y: { grid: { color: d.gridColor }, ticks: { color: d.textColor }, beginAtZero: true }
    },
    interaction: { intersect: false, mode: 'index' }
  };
};

export const barOptions = (isDark, title) => {
  const d = chartDefaults(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: d.textColor, usePointStyle: true, padding: 16 } },
      title: { display: !!title, text: title, color: d.textColor, font: { size: 14, weight: '500' } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: d.textColor } },
      y: { grid: { color: d.gridColor }, ticks: { color: d.textColor }, beginAtZero: true }
    },
    interaction: { intersect: false, mode: 'index' }
  };
};

export const buildLineData = (data, label, color, fill = false) => {
  if (!data || !data.labels) return null;
  const gradientColor = 'rgba(59, 130, 246, 0.2)';
  return {
    labels: data.labels,
    datasets: [{
      label,
      data: data.values,
      borderColor: color || '#667eea',
      backgroundColor: fill ? gradientColor : color || '#667eea',
      fill,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: color || '#667eea',
      borderWidth: 2
    }]
  };
};
