// ================================
//  Bharat Stock Scout - Live Data
// ================================

// Your Alpha Vantage API Key
window.ALPHA_VANTAGE_API_KEY = "6CUWCEKKTSLIXQ7L";

// Default stock data (fallback if API fails)
const stockData = {
    intraday: [
        { symbol: 'INFY', price: 1542.35, volume: '2.7M', rsi: 63, target: 1733.46, stopLoss: 1408.57 },
        { symbol: 'TCS', price: 3315.50, volume: '4.3M', rsi: 59, target: 3776.01, stopLoss: 2993.14 },
        { symbol: 'HDFCBANK', price: 1432.80, volume: '4.3M', rsi: 63, target: 1528.23, stopLoss: 1366.00 }
    ],
    swing: [
        { symbol: 'RELIANCE', price: 2456.75, pattern: 'Cup & Handle', target: 2650.00, stopLoss: 2350.00 },
        { symbol: 'BHARTIARTL', price: 715.20, pattern: 'Flag', target: 780.00, stopLoss: 690.00 }
    ],
    investment: [
        { symbol: 'ASIANPAINT', price: 3150.00, pe: 65.2, roe: 28.5, sector: 'FMCG', divYield: 1.2, target: 3400.00 }
    ]
};

// Fetch latest price from Alpha Vantage (BSE)
async function getStockPrice(symbol) {
    const apiKey = window.ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}.BSE&interval=1min&apikey=${apiKey}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();

        const timeSeries = data["Time Series (1min)"];
        if (!timeSeries) return null;

        const latestTime = Object.keys(timeSeries)[0];
        return parseFloat(timeSeries[latestTime]["1. open"]);
    } catch (err) {
        console.error("Error fetching price for", symbol, err);
        return null;
    }
}

// Render a stock table
async function renderTable(elementId, data, type) {
    const tableBody = document.getElementById(elementId);
    tableBody.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        const stock = data[i];

        // Delay to respect API limits
        if (i > 0) await new Promise(res => setTimeout(res, 1500));

        let livePrice = stock.price; // fallback
        const fetchedPrice = await getStockPrice(stock.symbol);
        if (fetchedPrice) livePrice = fetchedPrice;

        const row = document.createElement('tr');

        if (type === 'intraday') {
            const profit = ((stock.target - livePrice) / livePrice * 100).toFixed(1);
            const loss = ((livePrice - stock.stopLoss) / livePrice * 100).toFixed(1);

            row.innerHTML = `
                <td>${stock.symbol}</td>
                <td>₹${livePrice.toFixed(2)}</td>
                <td>${stock.volume}</td>
                <td>${stock.rsi}</td>
                <td>₹${stock.target.toFixed(2)}</td>
                <td>₹${stock.stopLoss.toFixed(2)}</td>
                <td class="profit">+${profit}%</td>
                <td class="loss">-${loss}%</td>
            `;
        } 
        else if (type === 'swing') {
            const profit = ((stock.target - livePrice) / livePrice * 100).toFixed(1);
            const loss = ((livePrice - stock.stopLoss) / livePrice * 100).toFixed(1);

            row.innerHTML = `
                <td>${stock.symbol}</td>
                <td>₹${livePrice.toFixed(2)}</td>
                <td>${stock.pattern}</td>
                <td>₹${stock.target.toFixed(2)}</td>
                <td>₹${stock.stopLoss.toFixed(2)}</td>
                <td class="profit">+${profit}%</td>
                <td class="loss">-${loss}%</td>
            `;
        }
        else if (type === 'investment') {
            row.innerHTML = `
                <td>${stock.symbol}</td>
                <td>₹${livePrice.toFixed(2)}</td>
                <td>${stock.pe}</td>
                <td>${stock.roe}%</td>
                <td>${stock.sector}</td>
                <td>${stock.divYield}%</td>
                <td>₹${stock.target.toFixed(2)}</td>
            `;
        }

        tableBody.appendChild(row);
    }
}

// Initialize tabs and load data
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // Load all tables
    renderTable('intraday-data', stockData.intraday, 'intraday');
    renderTable('swing-data', stockData.swing, 'swing');
    renderTable('investment-data', stockData.investment, 'investment');
});
