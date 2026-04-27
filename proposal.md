## CITS5506: Internet of Things

## Project Proposal: Smart Parking Management System

## 1. Name of project:

#### Smart Parking Management System

## 2. Group information:

```
Group Number: Group 19
```
```
Names Student Numbers
```
```
Atharva Dalvi 24591632
```
```
Jagdish Singh 24410218
```
```
Li Luo 24250049
```
```
Zihan Jia 24112045
```
## 3. Why do we want to do this project? What is the problem we will solve?

## What benefits will our solution bring and what is its impact?

# (1) Why this project

- Traditional parking management methods are inefficient and often rely on manual
    operation.
- Use automation and intelligent mechanisms to improve user parking experience.
- The traditional parking system did not have accurate information about parking
    availability.
**( 2 ) Problems to solve:**
- Drivers usually spend lots of time searching for available parking spaces.
- Parking areas may become congested due to inefficient traffic flow.
- The parking information is often inaccurate or delayed.
- Only relying on slot sensors may cause inaccurate occupancy information.
**( 3 ) Benefits and Impacts:**
- Provides more accurate parking availability by combining entry/exit counting with slot
    detection.
- Reduces the time drivers spend searching for parking.
- Reduces manual intervention through automated gate control, improving system efficiency.

## 4. Existing Solutions


A thorough review of already existing smart parking systems, be it commercial or academic IoT
implementations, was conducted to recognise current capabilities, research gaps, and capabilities.

## This review informed the architectural and operational decisions of our proposed system.

#### 4.1 Commercial Smart Parking System

Platforms such as ‘EasyPark’ provide digital parking services that permit users to locate parking
zones, start and stop parking sessions, and make payments through a mobile application.

```
Strengths:
```
- Easy to use and widely adopted user interface
- Scalable and reliable deployment across cities
- Integrated session tracking and digital payment
**Limitations:**
- Lack of integration with physical IoT infrastructure
- Lack of real-time validation of whether a specific parking slot is full/empty
- Availability is visible at zone level, not at an individual slot level
**Gap identified** :
Commercial systems give importance to convenience and payment but lack precise real-time
slot-level monitoring.
**Impact on Our Design:**
As stated in Section 5, our system integrates ultrasonic sensors for real-time slot detection,
ensuring that availability shown to users shows the real physical state of the parking lot.

**4.2 Sensor-Based IoT Parking Systems**

Ultrasonic sensors are used by many IoT-based parking systems to detect vehicle presence in
individual slots. The sensors have been proven to achieve over 95% detection accuracy within short
distances [1].
**Strengths:**

- Highly accurate in detecting individual parking occupancy
- Cheap and easy integration with microcontrollers
- Supports real-time updates
**Limitations:**
- Environmental factors or incorrect positioning may affect sensor readings
- Systems relying only on slot sensors may report false vacancy rates of up to ~8% [3],
[4]
- No backup mechanism if sensors fail
**Gap Identified:**
Single sensor approaches lack robustness and can produce inaccurate occupancy data.
**Impact on Our Design:**
Our system takes on a dual-detection approach, combining ultrasonic sensors with gate-based
vehicle counting to improve reliability and reduce error rates.

**4.3 Gate-Based Vehicle Counting Systems**

IR sensors at entry and exit points to track the total number of vehicles in a parking area, is rather
overlooked by modern parking systems.

```
Strengths:
```
- Provides overall vehicle count
- Works independently of slot-level sensors


- Low implementation cost
**Limitations:**
- Unable to identify which specific slots are readily available
- Does not provide guidance to users
- Limited usefulness when used alone
**Gap Identified:**
Gate-based systems provide only aggregate information, lacking slot-level detail.
**Impact on Our Design:**
As stated later in the report, we combine gate-level counting with slot-level sensing, allowing
both macro-level accuracy and detailed slot-level visibility.

#### 4.4 Access Control and User Authentication

## Existing systems use various methods such as RFID cards, license plate recognition, and QR codes.

```
Comparison:
```
## Method Strength Limitation

## RFID Fast and reliable Requires physical card/tag

## License Plate Recognition Fully automated Expensive and complex

## QR Code Low cost and flexible Requires user interaction

```
Gap Identified:
Solutions often require additional hardware or introduce high costs for implementation.
Impact on Our Design:
We selected QR code-based authentication as it:
```
- Eliminates the need for additional user hardware
- Integrates easily with the booking system
- Is cost-effective for a prototype-scale implementation [2]

#### 4.5 Path Guidance Systems

Research shows that shortest-path algorithms (Dijkstra’s algorithm) can efficiently compute
navigation paths in parking environments [8].
**Strengths:**

- Efficient and reliable for structured layouts
- Suitable for real-time path computation
- Computationally lightweight for small systems
**Limitations:**
- Rarely implemented in small-scale IoT prototypes
- Many systems display availability without guiding users
**Gap Identified:**
Existing parking systems lack active navigation support.
**Impact on Our Design:**
For our small-scale 3-slot prototype, Dijkstra’s algorithm is sufficient and ensures robust


```
computation. Also, the system combines LED-based path guidance and web-based route
visualization.
```
#### 4.6 Data Management and Analytics Systems

InfluxDB and Grafana are tools used by modern IoT systems to monitor real-time data and generate
analytics dashboards [6], [7].
**Strengths:**

- Real-time data visualization
- Historical data tracking
- Supports performance and usage analysis
**Limitations:**
- Often excluded from small prototype systems
- Focus is typically on monitoring rather than user interaction
**Gap Identified:**
Limited use of data analytics in decision-making and system optimisation.
**Impact on Our Design:**
We integrate a real-time analytics dashboard, enabling:
- monitoring of occupancy trends
- identification of peak usage periods
- revenue tracking

#### 4.7 Key Research Gaps Identified

From the above analysis, the following key gaps were identified:

- Digital booking systems and real-time physical data lack integration
- Over-reliance on single detection methods
- Limited implementation of user guidance systems
- Less use of analytics for optimisation
- Weak synchronization between hardware and cloud systems

#### 4.8 Proposed Solution Positioning

Our Smart Parking Management System addresses these gaps through:

- Hybrid detection (ultrasonic + IR sensors) for improved accuracy
- End-to-end integration from booking to payment
- Real-time slot-level monitoring instead of zone-level estimation
- Navigation guidance using LED indicators and shortest-path algorithms
- Cloud-based analytics dashboard for monitoring and insights
This approach makes the system more reliable and practical compared to existing solutions,
particularly for small-scale implementations.

### 5. Methodology

#### 5.1 Research and Assessment

A review of existing IoT-based parking systems was conducted to understand current approaches
and identify gaps. Key findings that informed our design choices are summarised below.

**- Vehicle detection:**


```
Most existing smart parking solutions (e.g., ParkWhiz, SpotHero IoT pilots) use magnetic or
ultrasonic sensors per bay. Studies confirm that the HC-SR04 ultrasonic sensor achieves
detection accuracy above 95% at distances up to 4 m, making it the most cost-effective option
[1].
```
**- Gate-based vehicle counting:**
Research by Anand et al. (2020) shows that combining entry/exit IR sensors with per-slot
sensors significantly reduces occupancy errors caused by vehicles queuing in lanes before
parking. Gate-level counting provides a reliable fallback when individual slot sensors are
temporarily obstructed or fail [3].
**- Dual detection reliability:**
A comparative study of parking detection methods (IEEE Access, 2021) found that systems
relying solely on slot level sensors report up to 8% false-vacancy readings due to partial
occupancy or sensor drift. Combining gate-based counting with slot level sensing reduces this
error rate to below 2%, justifying our dual detection approach [4].
**- Gate control:**
Research on automated barrier systems shows that servo-motor-driven boom gates are the
simplest reliable mechanism for demo-scale deployments. Commercial alternatives (hydraulic
or stepper-motor gates) are cost-prohibitive for prototyping.
**- User authentication:**
Existing solutions use RFID cards, number plate recognition, or mobile QR codes. QR code
scanning was selected because it requires no additional hardware tag for users and integrates
directly with the booking website [2].
**- Payment:**
Published IoT parking work at similar scale (e.g., IJERT 2022) uses REST API based payment
gateways. Razorpay and Stripe both offer free sandbox APIs and webhook confirmation, which
suits our real-time gate-release requirement [9].
**- Path guidance:**
Prior work on indoor navigation (IEEE 2021) demonstrates that Dijkstra's algorithm on a static
parking graph delivers sub-millisecond route computation for lots with fewer than 500 nodes
suitable for our 3-slot demo.
**- Data recording and real-time dashboards:**
Industry deployments of IoT parking systems (e.g., PTC Inc., 2022) demonstrate that time-
series databases (InfluxDB) paired with visualisation tools (Grafana) provide the lowest latency
for live occupancy dashboard typically under 500 ms from sensor event to display update.
Historical timestamp data further enables peak-hour analysis and time-based billing, both of
which are incorporated into our system design [5].

#### 5.2 Project Scope and Conceptual Design

The system delivers eight core functionalities: real-time slot monitoring, gate-based vehicle
counting, dual detection for improved accuracy, QR-based automated gate control, shortest-path
guidance to a free or reserved slot, data recording and analysis, time-based payment on exit, and a
live analytics dashboard. The diagram below maps each functional area to its hardware components
and software modules.


#### diagram 1. Mind map of product features

The overall product framework is shown in diagram 2. A single Raspberry Pi 4 acts as the central
processing node. All sensors and actuators connect to its GPIO and USB ports. Data flows via Wi-
Fi and MQTT to the cloud backend, which serves the booking website, payment gateway, and
analytics dashboard [5], [10].

All core functionalities of the system are preserved; however, some components are implemented
using simplified hardware representations to reduce complexity while maintaining the intended
system behaviour.

For example, instead of implementing a full physical gate barrier, LED indicators are used to
represent the gate state (open/closed). A more detailed hardware configuration is provided in

### Section 9 for reference.


#### diagram 2. Framework of product solution

#### 5.3 Project Timeline

The project is planned over 8 weeks. Hardware procurement and physical model construction occur
first, followed by parallel software development streams, integrated testing, and final
documentation.

#### diagram 3. Gantt Chart for the Project Timeline

#### 5.4 Hardware Selection

Each hardware component was selected based on GPIO availability on the Raspberry Pi, cost,
availability, and suitability for a demo-scale prototype.


```
a. Raspberry Pi 4(Model B, 4 GB)
Chosen as the central processing unit because it provides 40 GPIO pins (26 usable), has built-in
Wi-Fi, runs full Linux (enabling Python, MQTT, and web server), and is widely used in IoT
research ensuring ample community support. The 4 GB RAM variant is selected to handle
simultaneous sensor polling, MQTT publishing, and QR scanner input without performance
constraints.
```
```
b. HC-SR04 Ultrasonic Sensor
Selected for slot detection due to its 2 cm - 4 m range, 3 mm accuracy, and low cost (~$1.
each). It interfaces directly with Raspberry Pi GPIO using two pins (TRIG/ECHO) and requires
no additional driver IC. Three units are used, one per parking slot, mounted overhead at a fixed
height of approximately 25 cm.
```
```
c. QR Code Scanner GM65 (USB/UART)
Chosen over RFID because it requires no physical tag for the user the QR code is generated on
the booking website and displayed on the user's phone. The GM65 module operates as a USB
HID keyboard device, meaning its output is read directly as text input in Python with no
additional driver. Two units are used at entry and exit Gates.
```
```
d. Servo Motor SG90 / MG996R
Selected for gate barrier actuation. The SG90 (9g) is sufficient for a lightweight cardboard
demo barrier; the MG996R (55g metal gear) is used if a heavier barrier arm is fitted. Both are
controlled via PWM on a single GPIO pin per motor. Two units are used one at the entry gate
and one at the exit gate.
```
```
e. RGB LED (5mm Common Cathode)
One RGB LED per slot provides a visual occupancy indicator: Green = Free, Red = Occupied,
Blue = Reserved. Common-cathode type was chosen for simpler wiring , each colour channel
connects to a GPIO pin through a 220 Ω current-limiting resistor. Nine resistors total (3 per
LED × 3 slots).
```
```
f. WS2812B Addressable LED Strip
Selected for the path guide system because the entire 1 m strip is controlled by a single GPIO
data pin (GPIO 18), drastically reducing wiring complexity. Each LED in the strip is
individually addressable, allowing specific arrow-shaped segments to be illuminated in
sequence to guide the driver.
```
```
g. 16×2 LCD with I2C Adapter
Two LCD displays (one at entry, one at exit) provide local user feedback: slot number after QR
verification and fare amount at exit. The I2C adapter (PCF8574) reduces the connection from 6
GPIO pins to 2 shared I2C pins (SDA/SCL), allowing both displays to share the same bus with
different I2C addresses (0x27 and 0x3F).
```
#### 5.5 Software Development

We will use Python on the Raspberry Pi as the hardware controller, a Flask (Python) or Node.js
(Express) backend hosted on a cloud server, and a React.js frontend for the booking website. The
following software modules will be developed:


**- Hardware Controller (Python / RPi.GPIO):** Polls ultrasonic sensors every 500 ms, reads
QR scanner USB input, controls servo gate motors via PWM, drives RGB LEDs and WS2812B
strip, and publishes all data to the MQTT broker using paho-mqtt.
**- MQTT Broker (Mosquitto):** Deployed locally on the Raspberry Pi for demo use, or on
HiveMQ cloud for wider access. Topics include parking/slot/N (occupancy), parking/gate/entry
and parking/gate/exit (gate commands), and parking/payment/status.
**- Cloud Backend (Flask / Node.js):** Handles user registration and login, QR code generation
(Python qrcode library), slot booking API, entry/exit timestamp logging, fare calculation,
Razorpay/Stripe payment webhook processing, and Dijkstra path computation using the Python
NetworkX library.
**- Database (Firebase Realtime DB / MySQL):** Stores user accounts, bookings, entry/exit
timestamps, payment receipts, and real-time slot status.
**- Website Frontend (React.js):** User portal for registration, slot booking, QR code display,
interactive parking map with animated path guide, payment page, and booking history.
**- Analytics Dashboard (Grafana + InfluxDB):** Receives time-series sensor data from the
backend and displays live occupancy, revenue, peak-hour heatmaps, and traffic trend charts.

#### 5.6 Testing and Improvement

Testing will proceed in four phases. First, each subsystem will be validated independently: sensor
readings verified against known distances, servo gate response time measured, QR scanner decode
accuracy tested with various phone screens and lighting conditions, and MQTT message delivery
confirmed. The gate-based IR vehicle counter will be verified by manually passing objects through
the entry and exit beams and confirming the vehicle count increments and decrements correctly.

Second, dual detection cross-validation will be tested by deliberately disconnecting one slot sensor
while vehicles occupy that bay and confirming that the gate counter still reflects accurate total
occupancy. Conversely, a vehicle will be left idling in the entry lane (not yet parked) to verify that
the gate counter correctly reflects it as inside the lot while slot sensors remain unaffected. The target
is an overall occupancy accuracy of 98% or above under all test conditions.

Third, integration testing will verify end-to-end flows: a complete booking-to-payment cycle will be
executed 20 times to confirm reliability, and edge cases such as a full parking lot, failed payment,
and sensor disconnection will be deliberately triggered to validate fallback behaviour. Dashboard
data accuracy will be verified by comparing live Grafana readings against the raw database values
for occupancy counts, vehicle totals, and revenue figures.

Fourth, user acceptance testing will be conducted with three to five participants who will attempt to
book, enter, park, and pay without assistance. Participants will also be asked to evaluate the clarity
of the path guide LED arrows and the website dashboard. Any friction points in the gate interaction,
payment flow, or dashboard readability will be recorded and addressed before the final
demonstration.

### 6. Functionality of Our Solution

#### 6.1 Main Functionalities


Our Smart Parking Management System prioritises user convenience, operational accuracy, and

## payment reliability. The system delivers eight key functionalities:

```
a. Real-time Slot Monitoring: Each parking slot is equipped with an ultrasonic sensor to detect
whether the slot is occupied or not. The sensor measures the distance continuously, and when a
car is parked, the distance becomes shorter. Based on this change, the system updates the slot
status as either “occupied” or “free”. This information is then sent to the system and shown on
the dashboard in real time. Slot status is published to the MQTT broker in real time and
reflected on the website dashboard and the RGB LED indicator above each slot, providing users
with instant visibility of parking availability before they arrive.
```
```
b. Gate-based Vehicle Counting: IR sensors are placed at both the entry and exit gates to
detect vehicles passing through. When a car enters, the system increases the vehicle count, and
when a car leaves, the count decreases. This helps improve the accuracy of the system,
especially in cases where slot sensors may not work perfectly.
```
```
c. Dual Detection for Improved Accuracy: The system uses both ultrasonic sensors for slot
detection and IR sensors for vehicle counting at the gate. By combining these two methods, the
system becomes more reliable than using only one. If a slot sensor temporarily fails or a car is
waiting in the lane before parking, the gate count can still provide an accurate total number of
vehicles. On the other hand, slot sensors give detailed information about each individual
parking space, which the gate count cannot provide. By using both methods together, the
system can reduce errors and improve overall accuracy.
```
```
d. QR-based Automated Gate Control: Users can pre-book a parking slot through the website
and will receive a QR code linked to their account. At the entry gate, an IR sensor detects when
a vehicle arrives and prompts the user to scan the QR code. The Raspberry Pi then checks the
QR code with the database. If it is valid, the system records the entry time and opens the gate
using a servo motor. After the vehicle passes, the gate will close automatically. At the exit gate,
the same QR code is scanned again to start the payment process. The gate will only open after
the payment is successfully completed.
```
```
e. Shortest Path Guide: After the QR code is verified at the entry, the system assigns either the
reserved slot or the nearest available slot to the user. The parking layout is represented as a
simple graph, and the system calculates the shortest path from the entrance to the target slot.
The path information is then sent to the Raspberry Pi, which turns on the LED indicators step
by step to guide the driver. At the same time, the route is also shown on the website. Once the
vehicle is detected in the parking slot, the guiding lights will turn off automatically.
```
```
f. Data Recording and Analysis: The system automatically records the entry and exit time for
each vehicle in the database. This data is used to calculate the parking fee based on the parking
duration. It can also be used for basic analysis, such as identifying busy hours, average parking
time, and how often each slot is used. All the data can be viewed by administrators through the
dashboard and can be exported if needed.
```
```
g. Time-Based Payment on Exit: When the user scans their QR code at the exit gate, the
system retrieves the entry time from the database and calculates the parking duration. Based on
this, the parking fee is calculated and shown to the user. The user then completes the payment
through the website. The gate will only open after the payment is confirmed. After that, a
payment record is saved in the database.
```

```
h. Real-Time Web Dashboard: A web-based dashboard is used to display real-time
information, such as available parking slots, total number of vehicles, and slot status. Both users
and administrators can access the dashboard. Users can check available slots before arriving,
while administrators can monitor parking usage and system performance. The dashboard
updates automatically when new data is received.
```
```
diagram 4. Conceptual system architecture and functional mapping
```
#### 6.2 Subsystems Process

The system operation can be divided into several key subsystems. The following processes describe

## how each subsystem works step by step.

**6.2.1 QR-Based Entry Gate and Slot Assignment**

## Here, we use the QR scanner at the entry gate as an example.

#### diagram 5. QR-based entry gate — subsystem process


```
a. An IR sensor detects a vehicle arriving at the entry gate and prompts the user to scan the QR
```
## code.

## b. The user scans the QR code using the scanner.

## c. The system receives the QR data and checks it against the database.

## d. The system verifies whether the booking is valid and the slot is available.

## e. If the verification is successful, the system records the entry time.

## f. The gate is then opened using a servo motor.

## g. The system provides guidance to the assigned parking slot.

## h. After the vehicle passes the gate, it closes automatically.

# 6.2.2 RealTime Slot Monitoring

#### diagram 6. Slot monitoring — subsystem process

```
a. Each parking slot is equipped with an ultrasonic sensor to detect vehicle presence.
b. The sensor measures the distance between itself and the ground.
c. If the distance is below a predefined threshold (e.g., 15 cm), the slot is considered occupied;
otherwise, it is free.
d. The system updates the slot status and stores the information.
e. The slot status is displayed to users through the system interface.
f. At the same time, LED indicators are used to show the status of each slot (e.g., red for
occupied, green for free).
g. If an issue is detected, such as an incorrect parking situation, the system can trigger an alert.
```
**6.2.3 Shortest Path Guide System**


```
diagram 7. Shortest path guide — subsystem process
```
```
a. After the QR code is verified at the entry, the system assigns a parking slot to the user.
b. The system calculates a suitable path from the entrance to the assigned slot.
c. The path information is sent to the local controller.
d. LED indicators are activated step by step to guide the driver to the parking slot.
e. At the same time, the route is also shown on the website.
f. Once the vehicle is parked, the guiding lights turn off automatically.
```
**6.2.4 Exit Gate and Time-based Payment**

```
diagram 8. Exit gate & payment — subsystem process
```
```
a. The vehicle arrives at the exit gate, and the IR sensor detects its presence.
```

```
b. The user scans the QR code at the exit.
c. The system receives the QR information and checks it in the database.
d. The system retrieves the entry time and records the exit time.
e. The parking duration is calculated, and the corresponding fee is generated.
f. The fee is shown to the user.
g. The user completes the payment through the website.
h. Once the payment is confirmed, the gate is opened automatically.
i. The parking slot is updated to “free”, and the system records the transaction.
```
### 7. Initial Distribution of Work

```
Name of
Student
```
```
Student Work Assigned Reason for the Assignment
```
```
Atharva
Ganesh Dalvi
Dalvi
```
```
a. Assemble hardware components
(sensors, wiring, setup)
b. Install and connect sensors
(entry/exit and slot sensors)
c. Test hardware functionality
```
1. Requires hands-on work
    with physical components
2. Suitable for a student
    familiar with hardware setup

```
Jagdish
Singh
```
```
a. Implement sensor logic
(entry/exit counting, slot detection)
b. Program Raspberry Pi /
microcontroller
```
1. Requires understanding of
    hardware and embedded
    systems
2. Suitable for a student with
    hardware programming
    experience
Li Luo a. Develop backend system (data
handling, storage, API)
b. Install and connect sensors
(entry/exit and slot sensors)
c. Assist in testing sensor
functionality
1. Central to system
functionality and data flow
2. Suitable for a student
familiar with programming

```
Zihan Jia a. Develop web dashboard (UI)
b. Display parking data (slots,
vehicle count)
c. Integrate frontend with backend
(API connection)
d. System testing and debugging
```
1. This task requires web
    development skills
2. Integration with backend
    ensures the system can
    present real-time data to
    users
3. Suitable for a student
    familiar with web
    development

### 8. Hardware Identified

#### 8.1 Final Hardware List (Implementation)

This table presents the actual hardware planned for prototype implementation, while the conceptual
design in Section 8.2 shows the broader system architecture considered during early design. For
example, the gate state is represented by LED indicators instead of a physical gate barrier.


**No. Component Qty Web address cost/per Delivery
Time(Days)**

```
Available
in UWA
```
## 1 Raspberry Pi

## RPI 3B+

## 1 https://core-electronics.com.au/raspberry-

## pi- 3 - model-b-plus.html

## $68.5 3 Yes

## 2 IR Distance

## Sensor

## 2 https://www.jaycar.com.au/duinotech-

```
arduino-compatible-ir-distance-
sensor/p/XC3735?pos=1&queryId=6a
```
## 3f9ec80df623eaabb7b

## $18.95 5 Yes

## 3 LED 2 https://www.ebay.com.au/b/5mm-

## Individual-LEDS/181880/bn_

## $2.5 5 Yes

## 4 Ultrasonic

## Sensor

## 3 https://core-electronics.com.au/33v-

## ultrasonic-distance-sensor.html

## $2.7 3 Yes

## 5 QR Code

```
Scanner
```
## Module

## 2 Ebay link $35.99 12 No

## 6 LCD Display

```
(I2C)
（white on
```
## blue）

## 2 https://core-electronics.com.au/lcd1602-

```
i2c-module-white-color-with-blue-
background-16x2-characters-lcd-
```
## 33v5v.html

## $12.25 3 Yes

## 7 RGB LED

```
(Common
Cathode,
```
## 5mm)

## 3 https://core-

## electronics.com.au/added/?product=

## $4.95 3 No

## 8 Breadboard

## （normal）

## 2 https://core-electronics.com.au/transparent-

```
solderless-breadboard- 300 - tie-points-zyj-
```
## 60.html

## $2.35 3 Yes

## 9 220Ω

## Resistors

## 9 https://core-electronics.com.au/passives-

## pack-resistors-and-diodes.html

## $9.8 3 Yes

## 10 Jumper

```
Wires (M-M,
M-F, F-F
```
## pack)

## 3 https://core-electronics.com.au/female-to-

```
female-dupont-line- 40 - pin-10cm-
```
## 24awg.html

## $2.91 3 Yes

## 11 5V 2A DC

```
Power
```
## Supply

## 1 https://www.altronics.com.au/p/m8904a-

```
powertran-5v-dc-2a-fixed-2.1mm-tip-
```
## appliance-plugpack/

## $21.95 5 Yes

## 12 Wi-Fi

```
Connection
(Lab
```
## Network)

#### 8.2 Detailed Hardware Reference (Conceptual Design)

```
The following table presents a more detailed hardware configuration considered during the design
```
## phase. Some components are simplified in the final implementation to ensure feasibility.

### No. Component Qty Purpose Category

### 1 Raspberry Pi 4

```
Model B (
```
### GB)

### 1 Central IoT

```
controller runs all
sensor logic, gate
control, MQTT, path
```
### algorithm

```
Main
```
### Controller


### 2 MicroSD Card

```
(32 GB, Class
```
### 10)

### 1 Operating system +

```
project code storage
```
### for Raspberry Pi

```
Main
```
### Controller

### 3 USB-C Power

```
Supply (5V
```
### 3A)

### 1 Powers the

### Raspberry Pi

```
Main
```
### Controller

### 4 IR Sensor FC-

### 51

### 1 Detects vehicle

### arriving at entry gate

### Entry Gate

### 5 QR Code

```
Scanner
Module
(GM65 or
```
### WAVGAT)

### 1 Reads user QR code

```
at entry gate via
USB/UART
```
### interface

### Entry Gate

### 6 Servo Motor

```
SG90 or
```
### MG996R

### 1 Opens and closes the

```
entry gate barrier
```
### arm

### Entry Gate

### 7 Gate Barrier

```
Arm
(DIY/acrylic
```
### rod)

### 1 Physical boom

### barrier at entry

### Entry Gate

### 8 16×2 LCD

```
Display with
```
### I2C Module

### 1 Displays welcome

```
message and
```
### assigned slot number

### Entry Gate

### 9 IR Sensor FC-

### 51

### 1 Detects vehicle

### arriving at exit gate

### Exit Gate

### 10 QR Code

```
Scanner
Module
(GM65 or
```
### WAVGAT)

### 1 Reads user QR code

### at exit gate

### Exit Gate

### 11 Servo Motor

```
SG90 or
```
### MG996R

### 1 Opens and closes the

### exit gate barrier arm

### Exit Gate

### 12 Gate Barrier

```
Arm
(DIY/acrylic
```
### rod)

### 1 Physical boom

### barrier at exit

### Exit Gate

### 13 16×2 LCD

```
Display with
```
### I2C Module

### 1 Displays fare amount

```
and payment status at
```
### exit

### Exit Gate

### 14 Ultrasonic

```
Sensor HC-
```
### SR

### 3 One per slot —

```
measures distance to
detect occupied/free
```
### (mounted overhead)

```
Parking
```
### Slots

### 15 RGB LED

```
(Common
```
### Cathode, 5mm)

### 3 One per slot —

```
Green=Free,
Red=Occupied,
```
### Blue=Reserved

```
Parking
```
### Slots

### 16 220Ω Resistors 9 Current limiting for

```
RGB LEDs (3 per
```
### LED)

```
Parking
```
### Slots

### 17 Wi-Fi Router 1 Connects Raspberry

```
Pi and all devices to
```
### internet and cloud

### Connectivity

### 18 5V 2A DC

```
Power Supply
(for
```
### servos/LEDs)

### 1 Dedicated power for

```
servo motors and
```
### LED strips

### Power

### 19 Large

```
Breadboard
```
### (830 points)

### 2 Prototyping and

```
connecting sensors,
```
### LEDs, and resistors

### Wiring


### 20 Jumper Wires

```
(M-M, M-F, F-
```
### F pack)

```
1
```
### pack

```
GPIO connections
between Raspberry
Pi, sensors, and
```
### actuators

### Wiring

### 21 GPIO Ribbon

```
Cable +
Breakout
```
### Board

### 1 Easier access to all

```
40 GPIO pins of
```
### Raspberry Pi

### Wiring

### 22 Cardboard /

```
Foam Board /
```
### Wood base

### 1 set Build physical demo

```
model of parking lot
with entry, exit, and
```
### 3 slots

### Model

### 9. References

```
[1] “Design and Implementation of a Smart Parking System with Real-Time Slot Detection and
Automated Gate Access,” MDPI Technologies, 2025. [Online]. Available:
https://www.mdpi.com/2227-7080/13/11/
```
```
[2] “Development of a QR-Code Based Smart Car Parking System,” IEEE Xplore, 2019.
[Online]. Available: https://ieeexplore.ieee.org/document/8975536/
```
```
[3] “Sensor Fusion-Based Vacant Parking Slot Detection and Tracking,” IEEE Transactions on
Intelligent Transportation Systems, 2014. [Online]. Available:
https://ieeexplore.ieee.org/abstract/document/6576873/
```
```
[4] “Research Review on Parking Space Detection Method,” ResearchGate, 2021. [Online].
Available:
https://www.researchgate.net/publication/348454518_Research_Review_on_Parking_Space_D
etection_Method
```
```
[5] “Smart Parking System using MQTT Communication Protocol and IBM Cloud,”
ResearchGate, 2021. [Online]. Available:
https://www.researchgate.net/publication/356517151_Smart_Parking_System_using_MQTT_C
ommunication_Protocol_and_IBM_Cloud
```
```
[6] “Get started with Grafana and InfluxDB,” Grafana Documentation, 2024. [Online].
Available: https://grafana.com/docs/grafana/latest/getting-started/get-started-grafana-influxdb/
```
```
[7] “Real-Time Data Monitoring Using InfluxDB and Grafana,” DEV Community, 2023.
[Online]. Available: https://dev.to/bsd/real-time-data-monitoring-using-influxdb-and-grafana-
3a1n
```
```
[8] E. W. Dijkstra, “A Note on Two Problems in Connexion with Graphs,” Numerische
Mathematik, vol. 1, pp. 269–271, 1959. [Online]. Available:
https://link.springer.com/article/10.1007/BF
```
```
[9] “Razorpay Payment Gateway Documentation,” Razorpay. [Online]. Available:
https://razorpay.com/docs
```
```
[10] “Eclipse Mosquitto — An open source MQTT broker,” Eclipse Foundation. [Online].
Available: https://mosquitto.org
```

