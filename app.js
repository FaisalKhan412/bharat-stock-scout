// Sample Data
const stocks = {
    intraday: [
        {
            symbol: "RELIANCE",
            price: 2450.50,
            volume: "8.2M",
            rsi: 58,
            target: 2550,
            stopLoss: 2400
        }
    ],
    swing: [
        {
            symbol: "TATASTEEL",
            price: 120.50,
            pattern: "Cup & Handle",
            target: 135,
            stopLoss: 110
        }
    ],
    investment: [ // Changed from 'long-term'
        {
            symbol: "INFY",
            price: 1850.75,
            pe: 25.3,
            roe: 28.5,
            debtToEquity: 0.3,
            target: 2100
        }
    ]
};

// Core Functions
function calculateMetrics(price, target, stopLoss) {
    const profit = ((target - price) / price * 100).toFixed(1);
    const loss = ((price - stopLoss) / price * 100).toFixed(1);
    return { profit, loss };
}

function renderStockRow(type, stock) {
    const row = document.createElement('tr');
    
    if (type === 'intraday') {
        const { profit, loss } = calculateMetrics(stock.price, stock.target, stock.stopLoss);
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN')}</td>
            <td>${stock.volume}</td>
            <td class="${stock.rsi < 30 ? 'profit' : stock.rsi > 70 ? 'loss' : 'neutral'}">${stock.rsi}</td>
            <td>₹${stock.target}</td>
            <td>₹${stock.stopLoss}</td>
            <td class="profit">+${profit}%</td>
            <td class="loss">-${loss}%</td>
        `;
    }
    else if (type === 'swing') {
        const { profit, loss } = calculateMetrics(stock.price, stock.target, stock.stopLoss);
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN')}</td>
            <td>${stock.pattern}</td>
            <td>₹${stock.target}</td>
            <td>₹${stock.stopLoss}</td>
            <td class="profit">+${profit}%</td>
            <td class="loss">-${loss}%</td>
        `;
    }
    else {
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN')}</td>
            <td class="${stock.pe < 30 ? 'profit' : 'loss'}">${stock.pe}</td>
            <td class="${stock.roe > 15 ? 'profit' : 'loss'}">${stock.roe}%</td>
            <td class="${stock.debtToEquity < 1 ? 'profit' : 'loss'}">${stock.debtToEquity}</td>
            <td>₹${stock.target}</td>
        `;
    }
    
    return row;
}

function renderStocks(type) {
    const container = document.getElementById(`${type}-stocks`);
    if (!container) return;
    
    container.innerHTML = '';
    stocks[type].forEach(stock => {
        container.appendChild(renderStockRow(type, stock));
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Render all sections
    renderStocks('intraday');
    renderStocks('swing');
    renderStocks('investment'); // Changed
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            document.querySelector('.tab-content.active').classList.remove('active');
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
});