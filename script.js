"use strict";

/*
    Municipal Analytics Web Portal
    Reads municipal_service_requests_cleaned.csv
    and generates interactive KPIs and charts.
*/


// ------------------------------------------------------------
// Global Chart.js settings
// ------------------------------------------------------------

Chart.defaults.font.family =
    "Arial, Helvetica, sans-serif";

Chart.defaults.color =
    "#4b5563";


// ------------------------------------------------------------
// Global variables
// ------------------------------------------------------------

const csvFile =
    "municipal_service_requests_cleaned.csv";

let fullData = [];

let departmentChart = null;
let statusChart = null;
let monthlyChart = null;
let priorityChart = null;

let filterEventsAdded = false;


// ------------------------------------------------------------
// Load the CSV file
// ------------------------------------------------------------

Papa.parse(csvFile, {

    download: true,

    header: true,

    dynamicTyping: true,

    skipEmptyLines: true,

    complete: function (results) {

        const validRows = results.data.filter(function (row) {

            return row &&
                Object.values(row).some(function (value) {

                    return value !== null &&
                        value !== undefined &&
                        String(value).trim() !== "";

                });

        });

        if (validRows.length === 0) {

            showDataError(
                "The CSV file was loaded, but it does not contain usable data."
            );

            return;
        }

        fullData = validRows;

        console.log(
            "CSV loaded successfully:",
            fullData
        );

        populateFilters(fullData);

        setupFilterEvents();

        updateDashboard(fullData);

    },

    error: function (error) {

        console.error(
            "CSV loading error:",
            error
        );

        showDataError(
            "The CSV file could not be loaded. Check the filename and run the website using Live Server."
        );

    }

});


// ------------------------------------------------------------
// General dashboard update
// ------------------------------------------------------------

function updateDashboard(data) {

    updateKPIs(data);

    createDepartmentChart(data);

    createStatusChart(data);

    createMonthlyChart(data);

    createPriorityChart(data);

}


// ------------------------------------------------------------
// Error handling
// ------------------------------------------------------------

function showDataError(message) {

    const errorSection =
        document.getElementById("errorMessage");

    if (errorSection) {

        errorSection.style.display = "block";

        errorSection.querySelector("p").textContent =
            message;

    }

    document.getElementById("totalRequests").textContent =
        "Error";

    document.getElementById("closedRequests").textContent =
        "Error";

    document.getElementById("averageResolution").textContent =
        "Error";

    document.getElementById("averageSatisfaction").textContent =
        "Error";

    document.getElementById("totalCost").textContent =
        "Error";

}


// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).trim();

}


function getValidNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }

    const cleanedValue =
        String(value)
            .replace(/[$,]/g, "")
            .trim();

    const number =
        Number(cleanedValue);

    return Number.isFinite(number)
        ? number
        : null;

}


function calculateAverage(values) {

    if (values.length === 0) {

        return 0;

    }

    const total = values.reduce(
        function (sum, value) {

            return sum + value;

        },
        0
    );

    return total / values.length;

}


function formatCurrency(value) {

    if (value >= 1000000000) {

        return (
            "$" +
            (value / 1000000000).toFixed(2) +
            "B"
        );

    }

    if (value >= 1000000) {

        return (
            "$" +
            (value / 1000000).toFixed(2) +
            "M"
        );

    }

    if (value >= 1000) {

        return (
            "$" +
            (value / 1000).toFixed(1) +
            "K"
        );

    }

    return (
        "$" +
        value.toFixed(2)
    );

}


function countByField(data, fieldName) {

    const counts = {};

    data.forEach(function (row) {

        const value =
            cleanText(row[fieldName]);

        if (value !== "") {

            counts[value] =
                (counts[value] || 0) + 1;

        }

    });

    return counts;

}


// ------------------------------------------------------------
// KPI calculations
// ------------------------------------------------------------

function updateKPIs(data) {

    const totalRequests =
        data.length;

    const closedRequests =
        data.filter(function (row) {

            return cleanText(row.Status)
                .toLowerCase() === "closed";

        }).length;

    const resolutionValues =
        data
            .map(function (row) {

                return getValidNumber(
                    row["Resolution Days"]
                );

            })
            .filter(function (value) {

                return value !== null &&
                    value >= 0;

            });

    const satisfactionValues =
        data
            .map(function (row) {

                return getValidNumber(
                    row["Citizen Satisfaction"]
                );

            })
            .filter(function (value) {

                return value !== null;

            });

    const costValues =
        data
            .map(function (row) {

                return getValidNumber(
                    row["Estimated Cost"]
                );

            })
            .filter(function (value) {

                return value !== null &&
                    value >= 0;

            });

    const averageResolution =
        calculateAverage(
            resolutionValues
        );

    const averageSatisfaction =
        calculateAverage(
            satisfactionValues
        );

    const totalCost =
        costValues.reduce(
            function (sum, value) {

                return sum + value;

            },
            0
        );

    document.getElementById(
        "totalRequests"
    ).textContent =
        totalRequests.toLocaleString();

    document.getElementById(
        "closedRequests"
    ).textContent =
        closedRequests.toLocaleString();

    document.getElementById(
        "averageResolution"
    ).textContent =
        averageResolution.toFixed(2);

    document.getElementById(
        "averageSatisfaction"
    ).textContent =
        averageSatisfaction.toFixed(2);

    document.getElementById(
        "totalCost"
    ).textContent =
        formatCurrency(totalCost);

}


// ------------------------------------------------------------
// Department chart
// ------------------------------------------------------------

function createDepartmentChart(data) {

    const departmentCounts =
        countByField(
            data,
            "Department"
        );

    const sortedDepartments =
        Object.entries(
            departmentCounts
        ).sort(function (a, b) {

            return b[1] - a[1];

        });

    const labels =
        sortedDepartments.map(
            function (item) {

                return item[0];

            }
        );

    const values =
        sortedDepartments.map(
            function (item) {

                return item[1];

            }
        );

    if (departmentChart) {

        departmentChart.destroy();

    }

    departmentChart =
        new Chart(
            document.getElementById(
                "departmentChart"
            ),
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Service Requests",

                            data:
                                values,

                            backgroundColor:
                                "#1f4e78",

                            borderRadius:
                                6
                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    indexAxis:
                        "y",

                    plugins: {

                        title: {

                            display:
                                true,

                            text:
                                "Requests by Department",

                            font: {

                                size:
                                    18,

                                weight:
                                    "bold"

                            }

                        },

                        legend: {

                            display:
                                false

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (context) {

                                        return (
                                            " Requests: " +
                                            Number(
                                                context.raw
                                            ).toLocaleString()
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                color:
                                    "#e5e7eb"

                            }

                        },

                        y: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );

}


// ------------------------------------------------------------
// Status chart
// ------------------------------------------------------------

function createStatusChart(data) {

    const statusCounts =
        countByField(
            data,
            "Status"
        );

    const preferredOrder = [
        "Closed",
        "Open",
        "In Progress",
        "Pending"
    ];

    const labels =
        preferredOrder.filter(
            function (status) {

                return Object.prototype.hasOwnProperty.call(
                    statusCounts,
                    status
                );

            }
        );

    Object.keys(
        statusCounts
    ).forEach(function (status) {

        if (!labels.includes(status)) {

            labels.push(status);

        }

    });

    const values =
        labels.map(
            function (status) {

                return statusCounts[status];

            }
        );

    if (statusChart) {

        statusChart.destroy();

    }

    statusChart =
        new Chart(
            document.getElementById(
                "statusChart"
            ),
            {

                type:
                    "doughnut",

                data: {

                    labels:
                        labels,

                    datasets: [
                        {

                            data:
                                values,

                            backgroundColor: [
                                "#70ad47",
                                "#ed7d31",
                                "#5b9bd5",
                                "#ffc000",
                                "#a5a5a5"
                            ],

                            borderWidth:
                                0

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "65%",

                    plugins: {

                        title: {

                            display:
                                true,

                            text:
                                "Status Distribution",

                            font: {

                                size:
                                    18,

                                weight:
                                    "bold"

                            }

                        },

                        legend: {

                            position:
                                "bottom"

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function (context) {

                                        const value =
                                            Number(
                                                context.raw
                                            );

                                        const total =
                                            context.dataset.data.reduce(
                                                function (sum, item) {

                                                    return (
                                                        sum +
                                                        Number(item)
                                                    );

                                                },
                                                0
                                            );

                                        const percentage =
                                            total === 0
                                                ? 0
                                                : (
                                                    (value / total) *
                                                    100
                                                ).toFixed(1);

                                        return (
                                            " " +
                                            context.label +
                                            ": " +
                                            value.toLocaleString() +
                                            " (" +
                                            percentage +
                                            "%)"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// ------------------------------------------------------------
// Monthly trend chart
// ------------------------------------------------------------

function createMonthlyChart(data) {

    const fullMonthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    const shortMonthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    const monthCounts = {};

    fullMonthNames.forEach(
        function (month) {

            monthCounts[month] =
                0;

        }
    );

    data.forEach(function (row) {

        let month =
            cleanText(row.Month);

        if (
            month === "" &&
            row["Date Opened"]
        ) {

            const openedDate =
                new Date(
                    row["Date Opened"]
                );

            if (
                !Number.isNaN(
                    openedDate.getTime()
                )
            ) {

                month =
                    fullMonthNames[
                        openedDate.getMonth()
                    ];

            }

        }

        if (
            Object.prototype.hasOwnProperty.call(
                monthCounts,
                month
            )
        ) {

            monthCounts[month]++;

        }

    });

    const values =
        fullMonthNames.map(
            function (month) {

                return monthCounts[month];

            }
        );

    if (monthlyChart) {

        monthlyChart.destroy();

    }

    monthlyChart =
        new Chart(
            document.getElementById(
                "monthlyChart"
            ),
            {

                type:
                    "line",

                data: {

                    labels:
                        shortMonthNames,

                    datasets: [
                        {

                            label:
                                "Requests",

                            data:
                                values,

                            borderColor:
                                "#1f4e78",

                            backgroundColor:
                                "rgba(31, 78, 120, 0.12)",

                            fill:
                                true,

                            tension:
                                0.35,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        title: {

                            display:
                                true,

                            text:
                                "Monthly Service Request Trend",

                            font: {

                                size:
                                    18,

                                weight:
                                    "bold"

                            }

                        },

                        legend: {

                            display:
                                false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                color:
                                    "#e5e7eb"

                            }

                        },

                        x: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );

}


// ------------------------------------------------------------
// Priority chart
// ------------------------------------------------------------

function createPriorityChart(data) {

    const priorityCounts =
        countByField(
            data,
            "Priority"
        );

    const priorityOrder = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    const values =
        priorityOrder.map(
            function (priority) {

                return (
                    priorityCounts[priority] ||
                    0
                );

            }
        );

    if (priorityChart) {

        priorityChart.destroy();

    }

    priorityChart =
        new Chart(
            document.getElementById(
                "priorityChart"
            ),
            {

                type:
                    "bar",

                data: {

                    labels:
                        priorityOrder,

                    datasets: [
                        {

                            label:
                                "Requests",

                            data:
                                values,

                            backgroundColor: [
                                "#a5a5a5",
                                "#5b9bd5",
                                "#ed7d31",
                                "#c00000"
                            ],

                            borderRadius:
                                6

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        title: {

                            display:
                                true,

                            text:
                                "Requests by Priority",

                            font: {

                                size:
                                    18,

                                weight:
                                    "bold"

                            }

                        },

                        legend: {

                            display:
                                false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                color:
                                    "#e5e7eb"

                            }

                        },

                        x: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );

}


// ------------------------------------------------------------
// Filter setup
// ------------------------------------------------------------

function getUniqueValues(
    data,
    fieldName
) {

    return [
        ...new Set(
            data
                .map(function (row) {

                    return cleanText(
                        row[fieldName]
                    );

                })
                .filter(function (value) {

                    return value !== "";

                })
        )
    ].sort(
        function (a, b) {

            return a.localeCompare(b);

        }
    );

}


function populateSelect(
    selectId,
    values,
    defaultLabel
) {

    const select =
        document.getElementById(
            selectId
        );

    select.innerHTML =
        "";

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value =
        "All";

    defaultOption.textContent =
        defaultLabel;

    select.appendChild(
        defaultOption
    );

    values.forEach(
        function (value) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(
                option
            );

        }
    );

}


function populateFilters(data) {

    populateSelect(
        "departmentFilter",
        getUniqueValues(
            data,
            "Department"
        ),
        "All Departments"
    );

    populateSelect(
        "statusFilter",
        getUniqueValues(
            data,
            "Status"
        ),
        "All Statuses"
    );

    populateSelect(
        "priorityFilter",
        getUniqueValues(
            data,
            "Priority"
        ),
        "All Priorities"
    );

}


function setupFilterEvents() {

    if (filterEventsAdded) {

        return;

    }

    document
        .getElementById(
            "departmentFilter"
        )
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById(
            "statusFilter"
        )
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById(
            "priorityFilter"
        )
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById(
            "resetFilters"
        )
        .addEventListener(
            "click",
            resetFilters
        );

    filterEventsAdded =
        true;

}


function applyFilters() {

    const selectedDepartment =
        document.getElementById(
            "departmentFilter"
        ).value;

    const selectedStatus =
        document.getElementById(
            "statusFilter"
        ).value;

    const selectedPriority =
        document.getElementById(
            "priorityFilter"
        ).value;

    const filteredData =
        fullData.filter(
            function (row) {

                const department =
                    cleanText(
                        row.Department
                    );

                const status =
                    cleanText(
                        row.Status
                    );

                const priority =
                    cleanText(
                        row.Priority
                    );

                const departmentMatches =
                    selectedDepartment === "All" ||
                    department === selectedDepartment;

                const statusMatches =
                    selectedStatus === "All" ||
                    status === selectedStatus;

                const priorityMatches =
                    selectedPriority === "All" ||
                    priority === selectedPriority;

                return (
                    departmentMatches &&
                    statusMatches &&
                    priorityMatches
                );

            }
        );

    updateDashboard(
        filteredData
    );

}


function resetFilters() {

    document.getElementById(
        "departmentFilter"
    ).value =
        "All";

    document.getElementById(
        "statusFilter"
    ).value =
        "All";

    document.getElementById(
        "priorityFilter"
    ).value =
        "All";

    updateDashboard(
        fullData
    );

}