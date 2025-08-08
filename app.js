console.log('app.js file execution started');
// Statistics Canada Data Explorer with Netlify Functions
class StatCanExplorer {
    constructor() {
        this.products = [];
        this.selectedVectors = new Map();
        this.fetchedData = [];
        this.seriesInfo = {};
        this.cubeMetadata = {};
        this.currentVisualizationType = 'line';

        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.showEmptyState();
    }

    // Load products from data.json
    async loadProducts() {
        console.log('Attempting to load products...');
        try {
            const response = await fetch('./data.json');
            console.log('Fetch response:', response);
            if (!response.ok) {
                console.error('Failed to fetch data.json, status:', response.status);
                this.showToast(`Failed to load data.json: ${response.statusText}`, 'error');
                return;
            }
            this.products = await response.json();
            console.log('Products loaded:', this.products);
            this.renderProductList();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Failed to load products data', 'error');
        }
    }

    // Render product list in sidebar
    renderProductList() {
        console.log('Rendering product list with products:', this.products);
        const productList = document.getElementById('product-list');
        if (!productList) {
            console.error('product-list element not found');
            return;
        }
        productList.innerHTML = '';

        this.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.id = `product-${product.productId}`;

            // Create product header
            const productHeader = document.createElement('div');
            productHeader.className = 'product-header';
            productHeader.onclick = () => this.toggleProduct(product.productId);

            // Create product ID element
            const productId = document.createElement('span');
            productId.className = 'product-id';
            productId.textContent = product.productId;

            // Create product title element
            const productTitle = document.createElement('span');
            productTitle.className = 'product-title';
            productTitle.textContent = product.description;

            // Create expand icon
            const expandIcon = document.createElement('i');
            expandIcon.className = 'fas fa-chevron-right expand-icon';
            expandIcon.id = `toggle-${product.productId}`;

            productHeader.appendChild(productId);
            productHeader.appendChild(productTitle);
            productHeader.appendChild(expandIcon);

            // Create vectors container
            const vectorsContainer = document.createElement('div');
            vectorsContainer.className = 'vector-list';
            vectorsContainer.id = `vectors-${product.productId}`;
            vectorsContainer.style.display = 'none';

            // Add vectors
            product.vectors.forEach(vector => {
                const vectorItem = document.createElement('div');
                vectorItem.className = 'vector-item';

                const vectorText = document.createElement('span');
                vectorText.className = 'vector-text';
                vectorText.textContent = vector.text;

                const vectorBtn = document.createElement('button');
                vectorBtn.className = 'btn btn-sm btn-outline vector-btn';
                vectorBtn.innerHTML = '<i class="fas fa-plus"></i>';
                vectorBtn.onclick = () => {
                    console.log('Vector button clicked:', vector.vectorId, product.productId, vector.text);
                    this.toggleVector(vector.vectorId, product.productId, vector.text);
                };

                vectorItem.appendChild(vectorText);
                vectorItem.appendChild(vectorBtn);
                vectorsContainer.appendChild(vectorItem);
            });

            productItem.appendChild(productHeader);
            productItem.appendChild(vectorsContainer);
            productList.appendChild(productItem);
        });
    }

    // Toggle product expansion
    toggleProduct(productId) {
        const productItem = document.getElementById(`product-${productId}`);
        const vectorsList = document.getElementById(`vectors-${productId}`);
        const toggleIcon = document.getElementById(`toggle-${productId}`);

        if (!productItem || !vectorsList || !toggleIcon) {
            console.error('Required elements not found for product:', productId);
            return;
        }

        console.log('Toggling product:', productId);

        if (vectorsList.style.display === 'none') {
            vectorsList.style.display = 'block';
            productItem.classList.add('expanded');
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-down');
        } else {
            vectorsList.style.display = 'none';
            productItem.classList.remove('expanded');
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-right');
        }
    }

    // Toggle vector selection
    toggleVector(vectorId, productId, text) {
        console.log('toggleVector called with:', { vectorId, productId, text });
        console.log('Current selectedVectors size:', this.selectedVectors.size);

        if (this.selectedVectors.has(vectorId)) {
            this.selectedVectors.delete(vectorId);
            console.log('Removed vector:', vectorId);
            this.showToast(`Removed vector ${vectorId}`, 'info');
        } else {
            this.selectedVectors.set(vectorId, { vectorId, productId, text });
            console.log('Added vector:', vectorId, 'Total vectors now:', this.selectedVectors.size);
            this.showToast(`Added vector ${vectorId}`, 'success');
        }

        console.log('Updating selected vectors list...');
        this.updateSelectedVectorsList();
        console.log('Updating vector buttons...');
        this.updateVectorButtons();
    }

    // Update selected vectors display
    updateSelectedVectorsList() {
        console.log('updateSelectedVectorsList called, selectedVectors size:', this.selectedVectors.size);

        const selectedList = document.getElementById('selected-vectors');
        if (!selectedList) {
            console.error('selected-vectors element not found!');
            return;
        }

        // Clear the container and remove empty state
        selectedList.innerHTML = '';
        console.log('Cleared selected list, adding vectors...');

        if (this.selectedVectors.size === 0) {
            // Show empty state when no vectors selected
            selectedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>Select vectors from products above</p>
                </div>
            `;
        } else {
            // Add selected vectors
            this.selectedVectors.forEach((vector, vectorId) => {
                console.log('Adding vector to list:', vectorId, vector);
                const vectorItem = document.createElement('div');
                vectorItem.className = 'selected-vector-item';

                // Create vector info div
                const vectorInfo = document.createElement('div');
                vectorInfo.className = 'vector-info';

                const vectorIdSpan = document.createElement('div');
                vectorIdSpan.className = 'vector-id-display';
                vectorIdSpan.textContent = vectorId;

                const vectorTextSpan = document.createElement('div');
                vectorTextSpan.className = 'vector-description';
                vectorTextSpan.textContent = vector.text;

                vectorInfo.appendChild(vectorIdSpan);
                vectorInfo.appendChild(vectorTextSpan);

                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-sm btn-danger';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.onclick = () => this.removeVector(vectorId);

                vectorItem.appendChild(vectorInfo);
                vectorItem.appendChild(removeBtn);
                selectedList.appendChild(vectorItem);
            });
        }

        // Update counter
        const counter = document.getElementById('vector-count');
        if (counter) {
            counter.textContent = this.selectedVectors.size;
            console.log('Updated counter to:', this.selectedVectors.size);
        } else {
            console.error('vector-count element not found!');
        }

        // Enable/disable fetch data button based on selection
        const fetchButton = document.getElementById('fetch-data');
        if (fetchButton) {
            if (this.selectedVectors.size > 0) {
                fetchButton.disabled = false;
                fetchButton.classList.remove('disabled');
                console.log('Enabled fetch data button');
            } else {
                fetchButton.disabled = true;
                fetchButton.classList.add('disabled');
                console.log('Disabled fetch data button');
            }
        }
    }

    // Remove vector from selection
    removeVector(vectorId) {
        this.selectedVectors.delete(vectorId);
        this.updateSelectedVectorsList();
        this.updateVectorButtons();
        this.showToast(`Removed vector ${vectorId}`, 'info');
    }

    // Update vector button states
    updateVectorButtons() {
        document.querySelectorAll('.vector-btn').forEach(btn => {
            // Find the vector ID by looking at the parent vector item
            const vectorItem = btn.closest('.vector-item');
            if (!vectorItem) return;

            // Get vector ID from the button's onclick function
            const onclickStr = btn.onclick.toString();
            const vectorIdMatch = onclickStr.match(/toggleVector\([\"']([^\"']+)["']/); 

            if (vectorIdMatch) {
                const vectorId = vectorIdMatch[1];
                const icon = btn.querySelector('i');

                if (this.selectedVectors.has(vectorId)) {
                    btn.className = 'btn btn-sm btn-primary vector-btn';
                    icon.className = 'fas fa-check';
                } else {
                    btn.className = 'btn btn-sm btn-outline vector-btn';
                    icon.className = 'fas fa-plus';
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Fetch data button
        const fetchDataBtn = document.getElementById('fetch-data');
        if (fetchDataBtn) {
            fetchDataBtn.addEventListener('click', () => {
                this.fetchData();
            });
        } else {
            console.warn('fetch-data button not found');
        }

        // Clear selection button
        const clearVectorsBtn = document.getElementById('clear-vectors');
        if (clearVectorsBtn) {
            clearVectorsBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        } else {
            console.warn('clear-vectors button not found');
        }

        // Visualization type buttons
        const vizBtns = document.querySelectorAll('.viz-btn');
        if (vizBtns.length > 0) {
            vizBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vizBtn = e.target.closest('.viz-btn');
                    if (vizBtn && vizBtn.dataset.viz) {
                        this.setVisualizationType(vizBtn.dataset.viz);
                    }
                });
            });
        } else {
            console.warn('No visualization buttons found');
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        } else {
            console.warn('export-btn button not found');
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        } else {
            console.warn('fullscreen-btn button not found');
        }

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        } else {
            console.warn('product-search input not found');
        }
    }

    // Fetch data from Statistics Canada API via Netlify Functions
    async fetchData() {
        if (this.selectedVectors.size === 0) {
            this.showToast('Please select at least one vector', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideEmptyState();

        const periods = parseInt(document.getElementById('periods-input')?.value) || 12;

        // Format request data according to Statistics Canada API specification
        // API expects: [{"vectorId":32164132, "latestN":3}]
        // Statistics Canada API expects an object with an array of vectorIds and a single latestN value
        const requestData = {
            vectorIds: Array.from(this.selectedVectors.keys()).map(vectorId => {
                // Remove 'v' prefix if present and convert to integer
                return vectorId.startsWith('v') ? parseInt(vectorId.substring(1)) : parseInt(vectorId);
            }),
            latestN: periods
        };

        try {
            console.log('Attempting to fetch data for vectors:', requestData);
            console.log('Selected vectors map:', Array.from(this.selectedVectors.entries()));

            // Use Netlify Function as API proxy
            const netlifyFunctionUrl = '/.netlify/functions/getDataFromVectors';

            console.log('Making request to Netlify Function:', netlifyFunctionUrl);
            console.log('Request payload:', JSON.stringify(requestData, null, 2));

            const response = await fetch(netlifyFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('Netlify Function successful:', data);
                this.processFetchedData(data);
                return;
            } else {
                const errorText = await response.text();
                console.error('Netlify Function failed:', response.status, response.statusText);
                console.error('Error response body:', errorText);
                throw new Error(`Netlify Function returned ${response.status}: ${errorText}`);
            }

        } catch (error) {
            console.error('Error fetching data from Statistics Canada API:', error);

            // Show specific error message instead of generic CORS dialog
            if (error.message.includes('404')) {
                this.showToast('Netlify function not found. Please check deployment.', 'error');
            } else if (error.message.includes('500')) {
                this.showToast('Server error occurred. Please try again later.', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                this.showToast('Network error. Please check your connection.', 'error');
            } else {
                this.showToast(`Data fetch failed: ${error.message}`, 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    // Process and store fetched data
    processFetchedData(data) {
        console.log('Processing fetched data:', data);
        this.fetchedData = [];
        this.seriesInfo = {};

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('No data returned from API or data is in unexpected format.');
            this.showToast('No data available for the selected vectors.', 'warning');
            this.showEmptyState('No data returned from the API.');
            return;
        }

        // Process each series in the response
        data.forEach(series => {
            if (series.object) {
                const { object, responseStatusCode } = series;
                const vectorId = `v${object.vectorId}`;

                if (responseStatusCode === 0) {
                    // Store series info for tooltips and legends
                    this.seriesInfo[vectorId] = {
                        label: object.label,
                        measure: object.measure,
                        title: object.title,
                        frequency: object.frequencyCode,
                        decimals: object.decimals
                    };

                    // Flatten data for visualization
                    object.vectorDataPoint.forEach(dp => {
                        this.fetchedData.push({
                            date: dp.refper,
                            value: dp.value,
                            series: vectorId,
                            label: object.label // Add label for direct use in Vega
                        });
                    });
                } else {
                    console.warn(`No data for vector ${vectorId}. Status: ${responseStatusCode}`);
                }
            }
        });

        console.log('Processed data for visualization:', this.fetchedData);
        console.log('Series info:', this.seriesInfo);

        if (this.fetchedData.length > 0) {
            this.renderVisualization();
        } else {
            this.showEmptyState('No data points available for the selected vectors.');
            this.showToast('No data points found for the selection.', 'warning');
        }
    }

    // Render visualization based on type
    renderVisualization() {
        if (this.currentVisualizationType === 'table') {
            this.generateTableView();
        } else {
            this.generateVegaVisualization();
        }
    }

    // Generate Vega-Lite visualization
    generateVegaVisualization() {
        const vizContainer = document.getElementById('visualization');
        if (!vizContainer) return;

        if (this.fetchedData.length === 0) {
            this.showEmptyState('No data to visualize.');
            return;
        }

        const spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'Statistics Canada Data Explorer',
            width: 'container',
            height: 'container',
            data: {
                values: this.fetchedData
            },
            mark: {
                type: this.currentVisualizationType,
                tooltip: true,
                point: this.currentVisualizationType === 'line' ? { size: 50 } : false,
                interpolate: 'monotone'
            },
            encoding: {
                x: {
                    field: 'date',
                    type: 'temporal',
                    title: 'Date',
                    axis: {
                        labelAngle: -45,
                        format: '%Y-%m-%d'
                    }
                },
                y: {
                    field: 'value',
                    type: 'quantitative',
                    title: 'Value'
                },
                color: {
                    field: 'series',
                    type: 'nominal',
                    legend: {
                        title: 'Vector',
                        orient: 'bottom',
                        columns: 1,
                        labelLimit: 300
                    }
                },
                tooltip: [
                    { field: 'series', type: 'nominal', title: 'Vector' },
                    { field: 'date', type: 'temporal', title: 'Date', format: '%Y-%m-%d' },
                    { field: 'value', type: 'quantitative', title: 'Value', format: ',.2f' }
                ]
            },
            config: {
                view: {
                    stroke: null
                },
                axis: {
                    grid: true,
                    gridColor: '#e0e0e0'
                },
                font: 'Inter'
            }
        };

        vegaEmbed('#visualization', spec, { actions: true }).catch(console.error);
    }

    // Generate table view
    generateTableView() {
        const vizContainer = document.getElementById('visualization');
        if (!vizContainer) return;

        if (this.fetchedData.length === 0) {
            this.showEmptyState('No data to display in table.');
            return;
        }

        // Group data by date
        const dataByDate = this.fetchedData.reduce((acc, item) => {
            if (!acc[item.date]) {
                acc[item.date] = {};
            }
            acc[item.date][item.series] = item.value;
            return acc;
        }, {});

        const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
        const seriesIds = Array.from(this.selectedVectors.keys());

        let tableHtml = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            ${seriesIds.map(id => `<th>${id}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedDates.map(date => `
                            <tr>
                                <td>${date}</td>
                                ${seriesIds.map(id => `<td>${dataByDate[date][id] !== undefined ? dataByDate[date][id] : 'N/A'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        vizContainer.innerHTML = tableHtml;
    }

    // Set visualization type
    setVisualizationType(type) {
        this.currentVisualizationType = type;
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.viz === type);
        });

        if (this.fetchedData.length > 0) {
            this.renderVisualization();
        }
    }

    // Export data to CSV
    exportData() {
        if (this.fetchedData.length === 0) {
            this.showToast('No data to export', 'warning');
            return;
        }

        const headers = ['date', 'value', 'series', 'label'];
        const csvContent = [
            headers.join(','),
            ...this.fetchedData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'statcan_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Toggle fullscreen mode for visualization
    toggleFullscreen() {
        const vizContainer = document.getElementById('visualization-container');
        if (vizContainer) {
            if (!document.fullscreenElement) {
                vizContainer.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    }

    // Search products
    searchProducts(query) {
        const lowerCaseQuery = query.toLowerCase();
        const productItems = document.querySelectorAll('.product-item');

        productItems.forEach(item => {
            const title = item.querySelector('.product-title').textContent.toLowerCase();
            const id = item.querySelector('.product-id').textContent.toLowerCase();
            if (title.includes(lowerCaseQuery) || id.includes(lowerCaseQuery)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Clear all selections
    clearSelection() {
        this.selectedVectors.clear();
        this.fetchedData = [];
        this.seriesInfo = {};
        this.updateSelectedVectorsList();
        this.updateVectorButtons();
        this.showEmptyState();
        this.showToast('All selections cleared', 'info');
    }

    // Show/hide loading indicator
    showLoading(isLoading) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = isLoading ? 'flex' : 'none';
        }
    }

    // Show empty state in visualization area
    showEmptyState(message = 'Select vectors and click "Fetch Data" to see visualization.') {
        const vizContainer = document.getElementById('visualization');
        if (vizContainer) {
            vizContainer.innerHTML = `
                <div class="empty-state-viz">
                    <i class="fas fa-chart-line"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Hide empty state
    hideEmptyState() {
        const emptyState = document.querySelector('.empty-state-viz');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }
}

// Initialize the application once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StatCanExplorer();
});