// Enhanced sports data structure with location data
let teamsData = [
  { 
    name: "Titans", 
    players: 11, 
    matches: 15, 
    wins: 10, 
    losses: 5, 
    totalRuns: 1250, 
    totalWickets: 95,
    founded: 2020,
    captain: "John Smith",
    location: { lat: 40.7128, lng: -74.0060, city: "New York" },
    homeGround: "Titan Stadium"
  },
  { 
    name: "Warriors", 
    players: 11, 
    matches: 12, 
    wins: 8, 
    losses: 4, 
    totalRuns: 980, 
    totalWickets: 78,
    founded: 2019,
    captain: "Mike Johnson",
    location: { lat: 34.0522, lng: -118.2437, city: "Los Angeles" },
    homeGround: "Warrior Arena"
  },
  { 
    name: "Falcons", 
    players: 11, 
    matches: 18, 
    wins: 12, 
    losses: 6, 
    totalRuns: 1450, 
    totalWickets: 112,
    founded: 2021,
    captain: "David Brown",
    location: { lat: 41.8781, lng: -87.6298, city: "Chicago" },
    homeGround: "Falcon Field"
  }
];

// Sample players data
let playersData = [
  { name: "John Smith", team: "Titans", matches: 15, runs: 450, average: 30.0 },
  { name: "Mike Johnson", team: "Warriors", matches: 12, runs: 380, average: 31.7 },
  { name: "David Brown", team: "Falcons", matches: 18, runs: 520, average: 28.9 },
  { name: "Alex Wilson", team: "Titans", matches: 14, runs: 410, average: 29.3 },
  { name: "Chris Davis", team: "Warriors", matches: 16, runs: 480, average: 30.0 },
  { name: "Tom Miller", team: "Falcons", matches: 13, runs: 390, average: 30.0 }
];

let charts = {};
let weatherData = {};
let currentLocation = { lat: 40.7128, lng: -74.0060, city: "New York" };
let map;
let weatherUpdateInterval;

// Weather API configuration
const WEATHER_API_KEY = 'your_openweather_api_key'; // Replace with actual API key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

// Enhanced initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing enhanced platform...');
  
  try {
    // Initialize all components
    loadPlayerTable(playersData);
    loadAllCharts();
    loadTopPlayer();
    loadTeamStats();
    populateTeamOptions();
    updateTeamSelect();
    
    // Initialize weather and location services
    initializeLocationServices();
    initializeWeatherServices();
    initializeMap();
    initializeRealTimeUpdates();
    
    console.log('Enhanced platform initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
  
  addEventListeners();
});

function addEventListeners() {
  try {
    const elements = {
      teamSelect: document.getElementById('teamSelect'),
      addTeamBtn: document.getElementById('addTeamBtn'),
      saveTeamBtn: document.getElementById('saveTeamBtn'),
      cancelTeamBtn: document.getElementById('cancelTeamBtn'),
      exportBtn: document.getElementById('exportBtn'),
      team1Select: document.getElementById('team1Select'),
      team2Select: document.getElementById('team2Select')
    };

    // Check if all elements exist
    Object.keys(elements).forEach(key => {
      if (!elements[key]) {
        console.warn(`Element ${key} not found`);
      }
    });

    if (elements.teamSelect) {
      elements.teamSelect.addEventListener('change', filterByTeam);
    }
    if (elements.addTeamBtn) {
      elements.addTeamBtn.addEventListener('click', showAddTeamForm);
    }
    if (elements.saveTeamBtn) {
      elements.saveTeamBtn.addEventListener('click', saveNewTeam);
    }
    if (elements.cancelTeamBtn) {
      elements.cancelTeamBtn.addEventListener('click', hideAddTeamForm);
    }
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', exportData);
    }
    if (elements.team1Select) {
      elements.team1Select.addEventListener('change', updateComparison);
    }
    if (elements.team2Select) {
      elements.team2Select.addEventListener('change', updateComparison);
    }

    // Weather and location event listeners
    const locationBtn = document.getElementById('currentLocationBtn');
    const searchBtn = document.getElementById('getLocationBtn');
    const locationInput = document.getElementById('locationInput');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const generateReportBtn = document.getElementById('generateReportBtn');

    if (locationBtn) {
      locationBtn.addEventListener('click', getCurrentLocation);
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', searchLocation);
    }
    if (locationInput) {
      locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchLocation();
      });
    }
    if (importBtn) {
      importBtn.addEventListener('click', () => importFile.click());
    }
    if (importFile) {
      importFile.addEventListener('change', handleFileImport);
    }
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', generatePDFReport);
    }

    console.log('Enhanced event listeners added successfully');
  } catch (error) {
    console.error('Error adding enhanced event listeners:', error);
  }
}

function loadPlayerTable(data) {
  try {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
      console.error('Table body element not found');
      return;
    }
    
    tableBody.innerHTML = '';
    
    data.forEach(player => {
      const row = tableBody.insertRow();
      row.insertCell(0).textContent = player.name;
      row.insertCell(1).textContent = player.team;
      row.insertCell(2).textContent = player.matches;
      row.insertCell(3).textContent = player.runs;
      row.insertCell(4).textContent = player.average.toFixed(1);
    });
    
    console.log(`Loaded ${data.length} players`);
  } catch (error) {
    console.error('Error loading player table:', error);
  }
}

function filterByTeam() {
  try {
    const teamSelect = document.getElementById('teamSelect');
    if (!teamSelect) return;
    
    const selectedTeam = teamSelect.value;
    const filteredData = selectedTeam === 'all' 
      ? playersData 
      : playersData.filter(player => player.team === selectedTeam);
    
    loadPlayerTable(filteredData);
    console.log(`Filtered by team: ${selectedTeam}`);
  } catch (error) {
    console.error('Error filtering by team:', error);
  }
}

function loadAllCharts() {
  try {
    loadRunsChart();
    loadWinRateChart();
    loadPerformanceChart();
    loadComparisonChart();
    console.log('All charts loaded');
  } catch (error) {
    console.error('Error loading charts:', error);
  }
}

function loadRunsChart() {
  try {
    const canvas = document.getElementById('runsChart');
    if (!canvas) {
      console.warn('Runs chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.runsChart) {
      charts.runsChart.destroy();
    }
    
    charts.runsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: teamsData.map(team => team.name),
        datasets: [{
          label: '🏃‍♂️ Total Runs',
          data: teamsData.map(team => team.totalRuns),
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(255, 107, 107, 0.8)',
            'rgba(78, 205, 196, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(52, 152, 219, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(255, 107, 107, 1)',
            'rgba(78, 205, 196, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(52, 152, 219, 1)'
          ],
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false,
        }, {
          label: '🎯 Total Wickets',
          data: teamsData.map(team => team.totalWickets),
          backgroundColor: [
            'rgba(118, 75, 162, 0.8)',
            'rgba(238, 90, 36, 0.8)',
            'rgba(68, 160, 141, 0.8)',
            'rgba(230, 174, 0, 0.8)',
            'rgba(142, 68, 173, 0.8)',
            'rgba(41, 128, 185, 0.8)'
          ],
          borderColor: [
            'rgba(118, 75, 162, 1)',
            'rgba(238, 90, 36, 1)',
            'rgba(68, 160, 141, 1)',
            'rgba(230, 174, 0, 1)',
            'rgba(142, 68, 173, 1)',
            'rgba(41, 128, 185, 1)'
          ],
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutBounce'
        },
        plugins: {
          title: {
            display: true,
            text: '🏆 Team Performance Comparison',
            font: {
              family: 'Orbitron',
              size: 18,
              weight: 'bold'
            },
            color: '#667eea'
          },
          legend: {
            labels: {
              font: {
                family: 'Poppins',
                size: 14,
                weight: '600'
              },
              color: '#2c3e50',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#667eea',
            borderWidth: 2,
            cornerRadius: 10,
            titleFont: {
              family: 'Orbitron',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(102, 126, 234, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: '#667eea',
              font: {
                family: 'Poppins',
                size: 12,
                weight: '600'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#667eea',
              font: {
                family: 'Orbitron',
                size: 12,
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading runs chart:', error);
  }
}

function loadWinRateChart() {
  try {
    const canvas = document.getElementById('winRateChart');
    if (!canvas) {
      console.warn('Win rate chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.winRateChart) {
      charts.winRateChart.destroy();
    }
    
    const winRates = teamsData.map(team => 
      team.matches > 0 ? parseFloat((team.wins / team.matches * 100).toFixed(1)) : 0
    );
    
    charts.winRateChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: teamsData.map(team => `${team.name} (${team.matches > 0 ? (team.wins / team.matches * 100).toFixed(1) : 0}%)`),
        datasets: [{
          data: winRates,
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(255, 107, 107, 0.8)',
            'rgba(78, 205, 196, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(52, 152, 219, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(255, 107, 107, 1)',
            'rgba(78, 205, 196, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(52, 152, 219, 1)'
          ],
          borderWidth: 4,
          hoverBorderWidth: 6,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000,
          easing: 'easeOutElastic'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Poppins',
                size: 12,
                weight: '600'
              },
              color: '#2c3e50',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20
            }
          },
          title: {
            display: true,
            text: '🏆 Win Rate Distribution',
            font: {
              family: 'Orbitron',
              size: 18,
              weight: 'bold'
            },
            color: '#667eea',
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#667eea',
            borderWidth: 2,
            cornerRadius: 10,
            titleFont: {
              family: 'Orbitron',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            },
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  } catch (error) {
    console.error('Error loading win rate chart:', error);
  }
}

function loadPerformanceChart() {
  try {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) {
      console.warn('Performance chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.performanceChart) {
      charts.performanceChart.destroy();
    }
    
    const colors = [
      'rgba(102, 126, 234, 0.3)',
      'rgba(255, 107, 107, 0.3)',
      'rgba(78, 205, 196, 0.3)',
      'rgba(255, 193, 7, 0.3)',
      'rgba(155, 89, 182, 0.3)',
      'rgba(52, 152, 219, 0.3)'
    ];
    
    const borderColors = [
      'rgba(102, 126, 234, 1)',
      'rgba(255, 107, 107, 1)',
      'rgba(78, 205, 196, 1)',
      'rgba(255, 193, 7, 1)',
      'rgba(155, 89, 182, 1)',
      'rgba(52, 152, 219, 1)'
    ];
    
    charts.performanceChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['📊 Matches Played', '🏆 Win Rate %', '🏃‍♂️ Avg Runs/Match', '🎯 Avg Wickets/Match'],
        datasets: teamsData.map((team, index) => ({
          label: team.name,
          data: [
            Math.min(team.matches * 2, 100), // Normalize for better visualization
            team.matches > 0 ? (team.wins / team.matches * 100) : 0,
            team.matches > 0 ? Math.min((team.totalRuns / team.matches), 100) : 0,
            team.matches > 0 ? Math.min((team.totalWickets / team.matches * 10), 100) : 0
          ],
          backgroundColor: colors[index % colors.length],
          borderColor: borderColors[index % borderColors.length],
          borderWidth: 3,
          pointBackgroundColor: borderColors[index % borderColors.length],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: '⚡ Team Performance Radar',
            font: {
              family: 'Orbitron',
              size: 18,
              weight: 'bold'
            },
            color: '#667eea',
            padding: 20
          },
          legend: {
            labels: {
              font: {
                family: 'Poppins',
                size: 12,
                weight: '600'
              },
              color: '#2c3e50',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#667eea',
            borderWidth: 2,
            cornerRadius: 10,
            titleFont: {
              family: 'Orbitron',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(102, 126, 234, 0.2)',
              lineWidth: 2
            },
            angleLines: {
              color: 'rgba(102, 126, 234, 0.3)',
              lineWidth: 2
            },
            ticks: {
              color: '#667eea',
              font: {
                family: 'Poppins',
                size: 10,
                weight: '600'
              },
              backdropColor: 'rgba(255, 255, 255, 0.8)',
              backdropPadding: 4
            },
            pointLabels: {
              color: '#2c3e50',
              font: {
                family: 'Orbitron',
                size: 12,
                weight: 'bold'
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading performance chart:', error);
  }
}

function loadComparisonChart() {
  // Initialize empty comparison chart
  updateComparison();
}

function loadTopPlayer() {
  try {
    const topPlayerElement = document.getElementById('topPlayer');
    if (!topPlayerElement) {
      console.warn('Top player element not found');
      return;
    }
    
    if (playersData.length === 0) {
      topPlayerElement.textContent = 'No player data available';
      return;
    }
    
    const topPlayer = playersData.reduce((prev, current) => 
      (prev.runs > current.runs) ? prev : current
    );
    
    topPlayerElement.textContent = 
      `🌟 Top Performer: ${topPlayer.name} (${topPlayer.team}) - ${topPlayer.runs} runs`;
  } catch (error) {
    console.error('Error loading top player:', error);
  }
}

function loadTeamStats() {
  try {
    const totalTeams = teamsData.length;
    const totalMatches = teamsData.reduce((sum, team) => sum + team.matches, 0);
    const totalRuns = teamsData.reduce((sum, team) => sum + team.totalRuns, 0);
    const avgWinRate = totalTeams > 0 ? 
      teamsData.reduce((sum, team) => 
        sum + (team.matches > 0 ? team.wins / team.matches : 0), 0) / totalTeams * 100 : 0;
    
    const elements = {
      totalTeams: document.getElementById('totalTeams'),
      totalMatches: document.getElementById('totalMatches'),
      totalRuns: document.getElementById('totalRuns'),
      avgWinRate: document.getElementById('avgWinRate')
    };
    
    if (elements.totalTeams) elements.totalTeams.textContent = totalTeams;
    if (elements.totalMatches) elements.totalMatches.textContent = totalMatches;
    if (elements.totalRuns) elements.totalRuns.textContent = totalRuns.toLocaleString();
    if (elements.avgWinRate) elements.avgWinRate.textContent = avgWinRate.toFixed(1) + '%';
    
    console.log('Team stats updated');
  } catch (error) {
    console.error('Error loading team stats:', error);
  }
}

function populateTeamOptions() {
  try {
    const selects = ['team1Select', 'team2Select'];
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) {
        console.warn(`Select element ${selectId} not found`);
        return;
      }
      
      select.innerHTML = '<option value="">Select Team</option>';
      
      teamsData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.textContent = team.name;
        select.appendChild(option);
      });
    });
    
    console.log('Team options populated');
  } catch (error) {
    console.error('Error populating team options:', error);
  }
}

function updateTeamSelect() {
  try {
    const teamSelect = document.getElementById('teamSelect');
    if (!teamSelect) {
      console.warn('Team select element not found');
      return;
    }
    
    const currentValue = teamSelect.value;
    
    // Clear and rebuild options
    teamSelect.innerHTML = '<option value="all">All Teams</option>';
    
    const uniqueTeams = [...new Set(playersData.map(player => player.team))];
    uniqueTeams.forEach(team => {
      const option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      teamSelect.appendChild(option);
    });
    
    teamSelect.value = currentValue || 'all';
    console.log('Team select updated');
  } catch (error) {
    console.error('Error updating team select:', error);
  }
}

function updateComparison() {
  try {
    const team1Select = document.getElementById('team1Select');
    const team2Select = document.getElementById('team2Select');
    
    if (!team1Select || !team2Select) {
      console.warn('Comparison select elements not found');
      return;
    }
    
    const team1Name = team1Select.value;
    const team2Name = team2Select.value;
    
    if (!team1Name || !team2Name) {
      const canvas = document.getElementById('comparisonChart');
      if (canvas && charts.comparisonChart) {
        charts.comparisonChart.destroy();
        delete charts.comparisonChart;
      }
      return;
    }
    
    const team1 = teamsData.find(t => t.name === team1Name);
    const team2 = teamsData.find(t => t.name === team2Name);
    
    if (!team1 || !team2) {
      console.warn('Selected teams not found in data');
      return;
    }
    
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) {
      console.warn('Comparison chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (charts.comparisonChart) {
      charts.comparisonChart.destroy();
    }
    
    charts.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['📊 Matches', '🏆 Wins', '🏃‍♂️ Total Runs', '🎯 Total Wickets', '📈 Win Rate %'],
        datasets: [{
          label: `🔥 ${team1.name}`,
          data: [
            team1.matches,
            team1.wins,
            team1.totalRuns,
            team1.totalWickets,
            team1.matches > 0 ? (team1.wins / team1.matches * 100) : 0
          ],
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false,
        }, {
          label: `⚡ ${team2.name}`,
          data: [
            team2.matches,
            team2.wins,
            team2.totalRuns,
            team2.totalWickets,
            team2.matches > 0 ? (team2.wins / team2.matches * 100) : 0
          ],
          backgroundColor: 'rgba(255, 107, 107, 0.8)',
          borderColor: 'rgba(255, 107, 107, 1)',
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 2000,
          easing: 'easeOutBounce'
        },
        plugins: {
          title: {
            display: true,
            text: `🔥 ${team1.name} VS ${team2.name} ⚡`,
            font: {
              family: 'Orbitron',
              size: 18,
              weight: 'bold'
            },
            color: '#667eea',
            padding: 20
          },
          legend: {
            labels: {
              font: {
                family: 'Poppins',
                size: 14,
                weight: '600'
              },
              color: '#2c3e50',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#667eea',
            borderWidth: 2,
            cornerRadius: 10,
            titleFont: {
              family: 'Orbitron',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Poppins',
              size: 13
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(102, 126, 234, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: '#667eea',
              font: {
                family: 'Poppins',
                size: 12,
                weight: '600'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#667eea',
              font: {
                family: 'Orbitron',
                size: 11,
                weight: 'bold'
              }
            }
          }
        }
      }
    });
    
    console.log(`Comparison updated: ${team1Name} vs ${team2Name}`);
  } catch (error) {
    console.error('Error updating comparison:', error);
  }
}

function showAddTeamForm() {
  try {
    const form = document.getElementById('addTeamForm');
    if (form) {
      form.style.display = 'block';
      console.log('Add team form shown');
    }
  } catch (error) {
    console.error('Error showing add team form:', error);
  }
}

function hideAddTeamForm() {
  try {
    const form = document.getElementById('addTeamForm');
    const teamForm = document.getElementById('teamForm');
    
    if (form) form.style.display = 'none';
    if (teamForm) teamForm.reset();
    
    console.log('Add team form hidden');
  } catch (error) {
    console.error('Error hiding add team form:', error);
  }
}

function saveNewTeam() {
  try {
    const form = document.getElementById('teamForm');
    if (!form) {
      console.error('Team form not found');
      return;
    }
    
    const formData = new FormData(form);
    
    const newTeam = {
      name: formData.get('teamName'),
      players: parseInt(formData.get('players')) || 11,
      matches: parseInt(formData.get('matches')) || 0,
      wins: parseInt(formData.get('wins')) || 0,
      losses: parseInt(formData.get('losses')) || 0,
      totalRuns: parseInt(formData.get('totalRuns')) || 0,
      totalWickets: parseInt(formData.get('totalWickets')) || 0,
      founded: parseInt(formData.get('founded')) || new Date().getFullYear(),
      captain: formData.get('captain') || 'TBD'
    };
    
    // Validation
    if (!newTeam.name) {
      alert('Team name is required!');
      return;
    }
    
    if (teamsData.find(team => team.name.toLowerCase() === newTeam.name.toLowerCase())) {
      alert('Team name already exists!');
      return;
    }
    
    if (newTeam.wins + newTeam.losses > newTeam.matches) {
      alert('Wins + Losses cannot exceed total matches!');
      return;
    }
    
    teamsData.push(newTeam);
    hideAddTeamForm();
    
    // Refresh all components
    loadAllCharts();
    loadTeamStats();
    populateTeamOptions();
    updateTeamSelect();
    
    alert(`Team "${newTeam.name}" added successfully!`);
    console.log('New team saved:', newTeam);
  } catch (error) {
    console.error('Error saving new team:', error);
    alert('Error saving team. Please try again.');
  }
}

function exportData() {
  try {
    const data = {
      teams: teamsData,
      players: playersData,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sports_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Data exported successfully');
    alert('Data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

// Add some demo functions for testing
function addSampleData() {
  const sampleTeams = [
    { name: "Eagles", players: 11, matches: 10, wins: 7, losses: 3, totalRuns: 850, totalWickets: 65, founded: 2022, captain: "Sample Captain" }
  ];
  
  sampleTeams.forEach(team => {
    if (!teamsData.find(t => t.name === team.name)) {
      teamsData.push(team);
    }
  });
  
  loadAllCharts();
  loadTeamStats();
  populateTeamOptions();
  updateTeamSelect();
}

// Weather and Location Services
function initializeLocationServices() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Current Location'
        };
        updateWeatherData();
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Use default location
        updateWeatherData();
      }
    );
  }
}

function initializeWeatherServices() {
  updateWeatherData();
  
  // Update weather every 10 minutes
  weatherUpdateInterval = setInterval(updateWeatherData, 600000);
}

async function updateWeatherData() {
  try {
    const widget = document.getElementById('weatherWidget');
    widget.classList.add('updating');
    
    // For demo purposes, using mock weather data
    // Replace with actual API call: const response = await fetch(`${WEATHER_API_URL}/weather?lat=${currentLocation.lat}&lon=${currentLocation.lng}&appid=${WEATHER_API_KEY}&units=metric`);
    
    const mockWeatherData = {
      main: {
        temp: Math.round(Math.random() * 30 + 5),
        humidity: Math.round(Math.random() * 50 + 30),
        pressure: Math.round(Math.random() * 50 + 1000)
      },
      weather: [
        {
          main: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
          description: 'scattered clouds',
          icon: '02d'
        }
      ],
      wind: {
        speed: Math.round(Math.random() * 20 + 5),
        deg: Math.round(Math.random() * 360)
      },
      visibility: Math.round(Math.random() * 5000 + 5000),
      name: currentLocation.city
    };
    
    weatherData = mockWeatherData;
    updateWeatherDisplay();
    updateWeatherAnalytics();
    generateMatchRecommendations();
    
    widget.classList.remove('updating');
  } catch (error) {
    console.error('Error updating weather data:', error);
    displayWeatherError();
  }
}

function updateWeatherDisplay() {
  const widget = document.getElementById('weatherWidget');
  const condition = document.getElementById('weatherCondition');
  const details = document.getElementById('weatherDetails');
  
  widget.innerHTML = `
    <div class="weather-content">
      <div class="weather-temp">${weatherData.main.temp}°C</div>
      <div class="weather-desc">${weatherData.weather[0].description}</div>
      <div class="weather-details-grid">
        <div class="weather-detail">
          <i class="fas fa-tint"></i>
          <span>${weatherData.main.humidity}%</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-wind"></i>
          <span>${weatherData.wind.speed} m/s</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-thermometer-half"></i>
          <span>${weatherData.main.pressure} hPa</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-eye"></i>
          <span>${(weatherData.visibility/1000).toFixed(1)} km</span>
        </div>
      </div>
    </div>
  `;
  
  if (condition) {
    condition.textContent = weatherData.weather[0].main;
  }
  
  if (details) {
    details.innerHTML = `
      <i class="fas fa-thermometer-half"></i>
      <span>${weatherData.main.temp}°C</span>
      <i class="fas fa-wind"></i>
      <span>${weatherData.wind.speed} m/s</span>
    `;
  }
}

function getCurrentLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Current Location'
        };
        updateWeatherData();
        if (map) {
          map.setView([currentLocation.lat, currentLocation.lng], 10);
        }
      },
      (error) => {
        alert('Unable to get your location. Please try again.');
      }
    );
  }
}

async function searchLocation() {
  const input = document.getElementById('locationInput');
  const query = input.value.trim();
  
  if (!query) return;
  
  try {
    // Mock geocoding - replace with actual service
    const mockCoords = {
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'sydney': { lat: -33.8688, lng: 151.2093 }
    };
    
    const cityKey = query.toLowerCase();
    if (mockCoords[cityKey]) {
      currentLocation = {
        ...mockCoords[cityKey],
        city: query
      };
      updateWeatherData();
      if (map) {
        map.setView([currentLocation.lat, currentLocation.lng], 10);
      }
    } else {
      alert('Location not found. Try: London, Paris, Tokyo, or Sydney');
    }
  } catch (error) {
    console.error('Error searching location:', error);
    alert('Error searching location. Please try again.');
  }
}

// Map Integration
function initializeMap() {
  try {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    map = L.map('mapContainer').setView([currentLocation.lat, currentLocation.lng], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add team markers
    teamsData.forEach(team => {
      if (team.location) {
        const marker = L.marker([team.location.lat, team.location.lng])
          .addTo(map)
          .bindPopup(`
            <div class="map-popup">
              <h4>${team.name}</h4>
              <p><strong>Captain:</strong> ${team.captain}</p>
              <p><strong>Matches:</strong> ${team.matches}</p>
              <p><strong>Win Rate:</strong> ${(team.wins/team.matches*100).toFixed(1)}%</p>
              <p><strong>Home Ground:</strong> ${team.homeGround}</p>
            </div>
          `);
      }
    });
    
    console.log('Map initialized successfully');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Weather Analytics
function updateWeatherAnalytics() {
  // Update weather impact indicators
  const impact = getWeatherImpact();
  const impactElement = document.getElementById('teamsWeatherImpact');
  
  if (impactElement) {
    impactElement.innerHTML = `
      <div class="weather-impact-indicator ${impact.class}">
        <i class="${impact.icon}"></i>
        <span>${impact.message}</span>
      </div>
    `;
  }
  
  // Load weather performance chart
  loadWeatherPerformanceChart();
}

function getWeatherImpact() {
  const temp = weatherData.main.temp;
  const windSpeed = weatherData.wind.speed;
  const condition = weatherData.weather[0].main;
  
  if (condition === 'Rain' || condition === 'Snow' || windSpeed > 15) {
    return {
      class: 'weather-poor',
      icon: 'fas fa-exclamation-triangle',
      message: 'Poor conditions for outdoor sports'
    };
  } else if (temp < 5 || temp > 35 || windSpeed > 10) {
    return {
      class: 'weather-fair',
      icon: 'fas fa-info-circle',
      message: 'Fair conditions with some challenges'
    };
  } else {
    return {
      class: 'weather-good',
      icon: 'fas fa-check-circle',
      message: 'Excellent conditions for sports'
    };
  }
}

function loadWeatherPerformanceChart() {
  try {
    const canvas = document.getElementById('weatherPerformanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (charts.weatherChart) {
      charts.weatherChart.destroy();
    }
    
    // Mock weather performance data
    const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
    const performanceData = [85, 75, 45, 65]; // Performance scores
    
    charts.weatherChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: weatherConditions,
        datasets: [{
          label: 'Team Performance by Weather',
          data: performanceData,
          backgroundColor: 'rgba(102, 126, 234, 0.3)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(102, 126, 234, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '🌤️ Weather Impact on Performance',
            font: { family: 'Orbitron', size: 16, weight: 'bold' },
            color: '#667eea'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(102, 126, 234, 0.2)' },
            ticks: { color: '#667eea', font: { size: 10 } }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading weather chart:', error);
  }
}

// Real-time Updates
function initializeRealTimeUpdates() {
  updateLiveScores();
  updateWeatherAlerts();
  
  // Update every 30 seconds
  setInterval(() => {
    updateLiveScores();
    updateWeatherAlerts();
  }, 30000);
}

function updateLiveScores() {
  const container = document.getElementById('liveScores');
  if (!container) return;
  
  const mockScores = [
    { teams: 'Titans vs Warriors', score: '156/4 (18.2 overs)', status: 'Live' },
    { teams: 'Falcons vs Eagles', score: '203/7 (20 overs)', status: 'Complete' }
  ];
  
  container.innerHTML = mockScores.map(score => `
    <div class="live-item">
      <div>${score.teams}</div>
      <div>${score.score}</div>
      <span class="timestamp">${score.status}</span>
    </div>
  `).join('');
}

function updateWeatherAlerts() {
  const container = document.getElementById('weatherAlerts');
  if (!container) return;
  
  const alerts = [];
  
  if (weatherData.wind && weatherData.wind.speed > 15) {
    alerts.push({
      message: 'High wind speeds detected - consider indoor venues',
      type: 'warning',
      time: moment().format('HH:mm')
    });
  }
  
  if (weatherData.weather && weatherData.weather[0].main === 'Rain') {
    alerts.push({
      message: 'Rain expected - matches may be delayed',
      type: 'danger',
      time: moment().format('HH:mm')
    });
  }
  
  if (alerts.length === 0) {
    alerts.push({
      message: 'No weather alerts - perfect conditions for sports!',
      type: 'success',
      time: moment().format('HH:mm')
    });
  }
  
  container.innerHTML = alerts.map(alert => `
    <div class="live-item weather-${alert.type}">
      <div>${alert.message}</div>
      <span class="timestamp">${alert.time}</span>
    </div>
  `).join('');
}

function generateMatchRecommendations() {
  const container = document.getElementById('matchRecommendations');
  if (!container) return;
  
  const impact = getWeatherImpact();
  const recommendations = [];
  
  if (impact.class === 'weather-good') {
    recommendations.push({
      message: 'Perfect day for outdoor cricket matches',
      venue: 'All outdoor venues available',
      time: moment().format('HH:mm')
    });
  } else if (impact.class === 'weather-fair') {
    recommendations.push({
      message: 'Consider covered venues or shorter formats',
      venue: 'Semi-covered stadiums recommended',
      time: moment().format('HH:mm')
    });
  } else {
    recommendations.push({
      message: 'Indoor venues strongly recommended',
      venue: 'Move to indoor facilities',
      time: moment().format('HH:mm')
    });
  }
  
  container.innerHTML = recommendations.map(rec => `
    <div class="live-item">
      <div>${rec.message}</div>
      <div><small>${rec.venue}</small></div>
      <span class="timestamp">${rec.time}</span>
    </div>
  `).join('');
}

// File Import/Export Functions
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (importedData.teams) {
        teamsData = [...teamsData, ...importedData.teams];
      }
      if (importedData.players) {
        playersData = [...playersData, ...importedData.players];
      }
      
      // Refresh all components
      loadAllCharts();
      loadTeamStats();
      populateTeamOptions();
      updateTeamSelect();
      if (map) initializeMap();
      
      alert('Data imported successfully!');
    } catch (error) {
      alert('Error importing file. Please check the format.');
    }
  };
  reader.readAsText(file);
}

function generatePDFReport() {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('SportStats Analytics Report', 20, 30);
    
    // Add weather info
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm')}`, 20, 50);
    pdf.text(`Weather: ${weatherData.weather[0].main} - ${weatherData.main.temp}°C`, 20, 60);
    
    // Add team stats
    let yPos = 80;
    pdf.text('Team Statistics:', 20, yPos);
    yPos += 10;
    
    teamsData.forEach(team => {
      const winRate = (team.wins / team.matches * 100).toFixed(1);
      pdf.text(`${team.name}: ${team.matches} matches, ${winRate}% win rate`, 30, yPos);
      yPos += 10;
    });
    
    pdf.save(`sportsstats-report-${moment().format('YYYY-MM-DD')}.pdf`);
    alert('Report generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating report. Please try again.');
  }
}

// Enhanced error handling
function displayWeatherError() {
  const widget = document.getElementById('weatherWidget');
  widget.innerHTML = `
    <div class="weather-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Weather data unavailable</span>
    </div>
  `;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
  }
});
