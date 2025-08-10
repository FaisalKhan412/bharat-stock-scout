// API Configuration
const ALPHA_VANTAGE_API_KEY = "6CUWCEKKTSLIXQ7L";
const API_BASE_URL = "https://www.alphavantage.co/query";

// Sample Data (will be enhanced with real-time data)
const stocks = {
    intraday: [
        {
            symbol: "RELIANCE.BSE",
            price: 2450.50,
            volume: "8.2M",
            rsi: 58,
            target: 2550,
            stopLoss: 2400
        }
    ],
    swing: [
        {
            symbol: "TATASTEEL.BSE",
            price: 120.50,
            pattern: "Cup & Handle",
            target: 135,
            stopLoss: 110
        }
    ],
    investment: [
        {
            symbol: "INFY.BSE",
            price: 1850.75,
            pe: 25.3,
            roe: 28.5,
            sector: "IT",
            dividendYield: 2.4,
            target: 2100
        },
        {
            symbol: "HDFCBANK.BSE",
            price: 1650.25,
            pe: 18.7,
            roe: 16.8,
            sector: "BANK",
            dividendYield: 1.2,
            target: 1900
        },
        {
            symbol: "MARUTI.BSE",
            price: 9800.50,
            pe: 32.1,
            roe: 12.4,
            sector: "AUTO",
            dividendYield: 0.8,
            target: 11000
        },
        {
            symbol: "ITC.BSE",
            price: 420.75,
            pe: 22.4,
            roe: 24.1,
            sector: "FMCG",
            dividendYield: 3.2,
            target: 480
        },
        {
            symbol: "SUNPHARMA.BSE",
            price: 1250.00,
            pe: 28.3,
            roe: 14.7,
            sector: "PHARMA",
            dividendYield: 1.1,
            target: 1400
        }
    ]
};

// API Functions
async function fetchStockPrice(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const data = await response.json();
        return parseFloat(data['Global Quote']['05. price']) || stocks.investment.find(s => s.symbol === symbol)?.price;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return stocks.investment.find(s => s.symbol === symbol)?.price;
    }
}

async function fetchStockFundamentals(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
        const data = await response.json();
        return {
            pe: parseFloat(data.PERatio) || stocks.investment.find(s => s.symbol === symbol)?.pe,
            roe: parseFloat(data.ReturnOnEquityTTM) || stocks.investment.find(s => s.symbol === symbol)?.roe,
            dividendYield: parseFloat(data.DividendYield) * 100 || stocks.investment.find(s => s.symbol === symbol)?.dividendYield
        };
    } catch (error) {
        console.error(`Error fetching fundamentals for ${symbol}:`, error);
        return {
            pe: stocks.investment.find(s => s.symbol === symbol)?.pe,
            roe: stocks.investment.find(s => s.symbol === symbol)?.roe,
            dividendYield: stocks.investment.find(s => s.symbol === symbol)?.dividendYield
        };
    }
}

async function updateStockPrices() {
    document.getElementById('api-status').style.display = 'block';
    
    // Update investment stocks
    for (const stock of stocks.investment) {
        const [price, fundamentals] = await Promise.all([
            fetchStockPrice(stock.symbol),
            fetchStockFundamentals(stock.symbol)
        ]);
        
        stock.price = price || stock.price;
        if (fundamentals) {
            stock.pe = fundamentals.pe || stock.pe;
            stock.roe = fundamentals.roe || stock.roe;
            stock.dividendYield = fundamentals.dividendYield || stock.dividendYield;
        }
    }
    
    // Update intraday and swing stocks (price only)
    for (const stock of [...stocks.intraday, ...stocks.swing]) {
        stock.price = await fetchStockPrice(stock.symbol) || stock.price;
    }
    
    document.getElementById('api-status').style.display = 'none';
    renderAllStocks();
}

// Core Functions (remain exactly the same)
function calculateMetrics(price, target, stopLoss) {
    const profit = ((target - price) / price * 100).toFixed(1);
    const loss = ((price - stopLoss) / price * 100).toFixed(1);
    return { profit, loss };
}

function renderStockRow(type, stock) {
    const cleanSymbol = stock.symbol.replace('.BSE', '');
    const row = document.createElement('tr');
    
    if (type === 'intraday') {
        const { profit, loss } = calculateMetrics(stock.price, stock.target, stock.stopLoss);
        row.innerHTML = `
            <td>${cleanSymbol}</td>
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
            <td>${cleanSymbol}</td>
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
            <td>${cleanSymbol}</td>
            <td>₹${stock.price.toLocaleString('en-IN')}</td>
            <td class="${stock.pe < 20 ? 'profit' : 'loss'}">${stock.pe}</td>
            <td class="${stock.roe > 15 ? 'profit' : 'loss'}">${stock.roe}%</td>
            <td>${stock.sector}</td>
            <td>${stock.dividendYield}%</td>
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

function renderAllStocks() {
    renderStocks('intraday');
    renderStocks('swing');
    renderStocks('investment');
}

function setupSectorFilter() {
    const filter = document.getElementById('sector-filter');
    if (!filter) return;
    
    filter.addEventListener('change', (e) => {
        const sector = e.target.value;
        const container = document.getElementById('investment-stocks');
        
        if (sector === 'all') {
            renderStocks('investment');
            return;
        }
        
        container.innerHTML = '';
        stocks.investment
            .filter(stock => stock.sector === sector)
            .forEach(stock => {
                container.appendChild(renderStockRow('investment', stock));
            });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // First render with sample data
    renderAllStocks();
    
    // Then update with real-time data
    await updateStockPrices();
    
    // Setup tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tab-btn.active').classList.remove('active');
            document.querySelector('.tab-content.active').classList.remove('active');
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    // Setup sector filter
    setupSectorFilter();

    // Update prices every 5 minutes
    setInterval(updateStockPrices, 300000);
});