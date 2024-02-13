document.addEventListener('DOMContentLoaded', function() {
    
    const url = createApiUrl();

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const measurements = data.results;
            const latestReading = measurements[0];
            updateLatestReading(latestReading.value);
            updateTimestamp(latestReading.date.local);
            plotTrendLine(measurements);
            updateParticlesBasedOnReading(latestReading.value);
        })
        .catch(error => console.error('Error fetching data:', error));

    
        let isScrolling;
        // Scroll event listener
        window.addEventListener('scroll', () => {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                checkScrollAndMove();
            }, 66);
        }, false);
    });


function createApiUrl() {
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);

    // Formatting dates in YYYY-MM-DDTHH:MM:SS format
    const dateFrom = formatDate(oneMonthAgo) + 'T00:00:00';
    const dateTo = formatDate(currentDate) + 'T23:59:59';

    // Construct and return the API URL
    return `https://api.openaq.org/v2/measurements?location_id=1427215&parameter=pm25&date_from=${dateFrom}T00:00:00&date_to=${dateTo}T23:59:59&limit=1000`;
}
    
function formatDate(date) {
    const d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

function checkScrollAndMove() {
    const topContainer = document.getElementById('top-container');
    const bottomContainer = document.getElementById('bottom-container');
    const topContainerHeight = topContainer.offsetHeight;
    const scrollPosition = window.scrollY;

    // If the user has scrolled past half of the top container, move to the bottom container
    if (scrollPosition > topContainerHeight / 2 && scrollPosition < topContainerHeight) {
        bottomContainer.scrollIntoView({ behavior: 'smooth' });
    }
}
// Event listener for mouse movement
document.getElementById('particles-js').addEventListener('mousemove', function(event) {
    moveReadingCircle(event);
});

function moveReadingCircle(event) {
    const readingCircle = document.getElementById('reading-circle');
    const circleRect = readingCircle.getBoundingClientRect();
    const containerRect = document.getElementById('top-container').getBoundingClientRect();

    // Calculate new position, keeping the circle within the container
    let newX = event.clientX - circleRect.width / 2;
    let newY = event.clientY - circleRect.height / 2;

    // Clamp values to container boundaries
    newX = Math.max(containerRect.left, Math.min(newX, containerRect.right - circleRect.width));
    newY = Math.max(containerRect.top, Math.min(newY, containerRect.bottom - circleRect.height));

    readingCircle.style.left = newX + 'px';
    readingCircle.style.top = newY + 'px';
}


function updateLatestReading(value) {
    const valueInt = Math.round(value); // Convert to integer
    document.getElementById('reading-value').innerText = valueInt;
}

function updateTimestamp(timestamp) {
    // Parse the timestamp and format it to a more readable date and time
    const date = new Date(timestamp);
    const formattedTimestamp = date.toLocaleString(); // Formats to local date and time
    document.getElementById('latest-timestamp').innerText=formattedTimestamp;
}
function plotTrendLine(measurements) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    // Initialize global variables for gradient dimensions
    let width, height, gradient;
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: measurements.map(m => moment(m.date.local).toDate()),
            datasets: [{
                label: 'PM2.5',
                data: measurements.map(m => m.value),
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if (!chartArea) {
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                },
                borderColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if (!chartArea) {
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                },
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top', // Can be 'top', 'bottom', 'left', 'right'
                    labels: {
                        font: {
                            size: 12 // Size of the text
                        },
                        // ... other label properties ...
                    }
                }
            },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(tooltipItem, data) {
                        let label = data.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += tooltipItem.yLabel;
                        return label;
                    },
                    title: function(tooltipItem, data) {
                        return moment(data.labels[tooltipItem[0].index]).format('YYYY-MM-DD HH:mm:ss');
                    }
                }
            }
        }
    });
    function getGradient(ctx, chartArea) {
        const chartWidth = chartArea.right - chartArea.left;
        const chartHeight = chartArea.bottom - chartArea.top;
        if (!gradient || width !== chartWidth || height !== chartHeight) {
            width = chartWidth;
            height = chartHeight;
            gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, '#6396f6');
            gradient.addColorStop(0.2, '#9ab8eb');
            gradient.addColorStop(0.4, '#d1dae0');
            gradient.addColorStop(0.6, '#eadcc0');
            gradient.addColorStop(0.8, '#e3bf89');
            gradient.addColorStop(1, '#dca153');
        }
    
        return gradient;
    }
}

function updateParticlesBasedOnReading(value) {
    const numberOfParticles = calculateNumberOfParticles(value);
    particlesJS("particles-js", {
        "particles":{"number":{"value":numberOfParticles,
        "density":{"enable":true,"value_area":800}},
        "color":{"value":"#dc8447"},
        "shape":{"type":"circle",
        "stroke":{"width":0,"color":"#000000"},
        "polygon":{"nb_sides":5},
        "image":{"src":"img/github.svg","width":100,"height":100}},"opacity":{"value":1,"random":true,"anim":{"enable":false,  "speed":1,
        "opacity_min":0.1,
        "sync":false}},
        "size":{"value":8.017060304327615,"random":true,"anim":{"enable":false,"speed":40,"size_min":4.872186312404589,"sync":false}},"line_linked":{"enable":false,"distance":150,"color":"#ffffff","opacity":0.4,"width":1},"move":{"enable":true,"speed":9.620472365193136,"direction":"none","random":false,"straight":false,"out_mode":"out","bounce":false,"attract":{"enable":false,"rotateX":600,"rotateY":1200}}},"interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":true,"mode":"repulse"},"onclick":{"enable":false,"mode":"repulse"},"resize":true},"modes":{"grab":{"distance":400,"line_linked":{"opacity":1}},"bubble":{"distance":400,"size":40,"duration":2,"opacity":8,"speed":3},"repulse":{"distance":180,"duration":0.4},"push":{"particles_nb":4},"remove":{"particles_nb":2}}},"retina_detect":true});

    // var count_particles, stats, update; stats = new Stats; stats.setMode(0); stats.domElement.style.position = 'absolute'; stats.domElement.style.left = '0px'; stats.domElement.style.top = '0px'; document.body.appendChild(stats.domElement); count_particles = document.querySelector('.js-count-particles'); update = function() { stats.begin(); stats.end(); if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) { count_particles.innerText = window.pJSDom[0].pJS.particles.array.length; } requestAnimationFrame(update); }; requestAnimationFrame(update);;
}

function calculateNumberOfParticles(readingValue) {
    return Math.round(5 * readingValue);
}
