const DEFAULT_TEXT_COLOR = Color.dynamic(Color.black(), Color.white());
const SECONDARY_TEXT_COLOR = new Color("#bababa");
const OUTAGE_COLOR = Color.red();
const NO_OUTAGE_COLOR = Color.green();
const MAYBE_OUTAGE_COLOR = Color.orange();
const WIDGET_COLOR = Color.dynamic(Color.white(), new Color("#1c1c1e"));

// text
const DEFAULT_FONT = Font.mediumSystemFont(14);
const LARGE_FONT = Font.lightSystemFont(37);
const SECONDARY_FONT = Font.boldSystemFont(14);
const OUTAGE_MESSAGE = "Outage";
const NO_OUTAGE_MESSAGE = "Okay";
const MAYBE_OUTAGE_MESSAGE = "Maybe";

// other
const OUTAGE_CODE = "-";
const NO_OUTAGE_CODE = "+";
const MAYBE_OUTAGE_CODE = "0";
const SEEDS = new Map([
    [
        "1.1",
        "0-++++0-++++-0++++-0++++++++-0++++-0++-0++++-0++0-++++0-++++++++0-++++0-++0-++++0-++",
    ],
    [
        "1.2",
        "-0++++-0++++0-++++0-++++++++0-++++0-++0-++++0-++-0++++-0++++++++-0++++-0++-0++++-0++",
    ],
    [
        "2.1",
        "++++0-++++0-++++-0++++-0++-0++++-0++-0++++-0++++++++0-++++0-++0-++++0-++0-++++0-++++",
    ],
    [
        "2.2",
        "++++-0++++-0++++0-++++0-++0-++++0-++0-++++0-++++++++-0++++-0++-0++++-0++-0++++-0++++",
    ],
    [
        "3.1",
        "++0-++++0-++++-0++++-0++-0++++-0++++++++-0++++-0++0-++++0-++0-++++0-++++++++0-++++0-",
    ],
    [
        "3.2",
        "++-0++++-0++++0-++++0-++0-++++0-++++++++0-++++0-++-0++++-0++-0++++-0++++++++-0++++-0",
    ],
]);
const HOUR_MS = 60 * 60 * 1000;
const HOUR_BLOCK_SIZE = 2;
const MIN_TIMELINE_HOURS_LABEL = 4;
const WIDGET_PADDING = 15;

function getGroup() {
    const DEFAULT_GROUP = "1.1";
    let group = args.widgetParameter;
    if (!SEEDS.has(group)) {
        group = DEFAULT_GROUP;
    }
    return group;
}

function getStatusIndex(date) {
    const day = date.getDay();
    const hours = date.getHours();
    return day * 24 + hours;
}

function getStatus(pattern, date) {
    const status = pattern[getStatusIndex(date)];
    return status;
}

function offsetDate(date, hours) {
    const newDate = new Date(date.getTime() + hours * HOUR_MS);
    return newDate;
}

function getStartDate(date) {
    const endDate = getEndDate(date);
    const startDate = offsetDate(endDate, -HOUR_BLOCK_SIZE);
    return startDate;
}

function getEndDate(date) {
    let offset = (date.getHours() % HOUR_BLOCK_SIZE) - 1;
    if (offset < 0) {
        offset += HOUR_BLOCK_SIZE;
    }
    offset = HOUR_BLOCK_SIZE - offset;
    let endDate = offsetDate(date, offset);
    endDate.setMinutes(0);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);
    return endDate;
}

function getStatusString(status) {
    switch (status) {
        case OUTAGE_CODE:
            return OUTAGE_MESSAGE;
        case NO_OUTAGE_CODE:
            return NO_OUTAGE_MESSAGE;
        case MAYBE_OUTAGE_CODE:
        default:
            return MAYBE_OUTAGE_MESSAGE;
    }
}

function getStatusColor(status) {
    switch (status) {
        case OUTAGE_CODE:
            return OUTAGE_COLOR;
        case NO_OUTAGE_CODE:
            return NO_OUTAGE_COLOR;
        case MAYBE_OUTAGE_CODE:
        default:
            return MAYBE_OUTAGE_COLOR;
    }
}

function addText(widget, text, params = {}) {
    const font = params.font || DEFAULT_FONT;
    const textColor = params.color || DEFAULT_TEXT_COLOR;
    const widgetText = widget.addText(text);
    widgetText.font = font;
    widgetText.textColor = textColor;
    return widgetText;
}

async function setNotifications(date) {
    const BEFORE_EVENT_MINUTES = 30;
    const BEFORE_EVENT_HOURS = BEFORE_EVENT_MINUTES / 60;
    const untilEventMs = date.getTime() - CURRENT_DATE.getTime();

    if (untilEventMs < BEFORE_EVENT_HOURS * HOUR_MS) {
        return;
    }

    const identifier = `${CURRENT_GROUP}-outage`;
    const status = getStatus(CURRENT_PATTERN, date);
    const title = `Lviv energy schedule: group ${CURRENT_GROUP}`;
    let text = "";
    switch (status) {
        case OUTAGE_CODE:
            text = `Power outage in ${BEFORE_EVENT_MINUTES} minutes`;
            break;
        case MAYBE_OUTAGE_CODE:
            text = `Possible power outage in ${BEFORE_EVENT_MINUTES} minutes`;
            break;
    }

    if (!text) {
        return;
    }

    const notifications = await Notification.allPending();
    const notification = notifications.find((n) => n.identifier === identifier);
    const triggerDate = offsetDate(date, -BEFORE_EVENT_HOURS);

    if (!notification) {
        const notification = new Notification();
        notification.identifier = identifier;
        notification.title = title;
        notification.body = text;
        notification.setTriggerDate(triggerDate);
        notification.schedule();
    }
}

function getPattern(seed) {
    const full = seed
        .split("")
        .map((s) => s.repeat(HOUR_BLOCK_SIZE))
        .join("");
    const pattern = `${full.slice(-1)}${full.slice(0, -1)}`;
    return pattern;
}

function getMediumWidgetSize() {
    const screenSize = Device.screenSize();
    const height = Math.max(screenSize.width, screenSize.height);
    const sizeMap = new Map([
        [932, new Size(364, 170)],
        [926, new Size(364, 170)],
        [896, new Size(360, 169)],
        [736, new Size(348, 157)],
        [852, new Size(338, 158)],
        [844, new Size(338, 158)],
        [812, new Size(329, 155)],
        [667, new Size(321, 148)],
        [780, new Size(329, 155)],
        [568, new Size(292, 141)],
    ]);
    // iPhone 13
    const defaultSize = sizeMap.get(844);
    switch (true) {
        case Device.isPhone():
            return sizeMap.get(height) || defaultSize;
        case Device.isPad():
        default:
            return defaultSize;
    }
}

function setupRootWidget() {
    const widget = new ListWidget();
    widget.backgroundColor = WIDGET_COLOR;
    return widget;
}

function drawStatus(widget) {
    addText(widget, `Group: ${CURRENT_GROUP}`);
    addText(widget, `${getStatusString(CURRENT_STATUS)}`, {
        font: LARGE_FONT,
        color: getStatusColor(CURRENT_STATUS),
    });
    widget.addSpacer();
}

function drawUpNext(widget, alighRight = false) {
    let line1 = widget;
    let line2 = widget;
    const formatter = new DateFormatter();
    formatter.dateFormat = "HH:mm";

    if (alighRight) {
        line1 = widget.addStack();
        line1.addSpacer();
        line2 = widget.addStack();
        line2.addSpacer();
        widget.addSpacer();
    }

    if (CURRENT_STATUS === OUTAGE_CODE) {
        addText(line1, `Outage ends:`);
        addText(line2, ` ${formatter.string(getEndDate(CURRENT_DATE))}`);
    } else {
        const nextOutageStartDate = getNextEventStartDate(OUTAGE_CODE);
        addText(line1, `Next outage:`);
        addText(
            line2,
            `${formatter.string(nextOutageStartDate)} - ${formatter.string(
                getEndDate(nextOutageStartDate)
            )}`
        );
    }
}

function drawTimeline(widget) {
    const OFFSET_HOURS = -3;
    const TIMELINE_HOURS_COUNT = 25;
    const startDate = getStartDate(CURRENT_DATE);
    const graphStartDate = offsetDate(startDate, OFFSET_HOURS);

    const canvas = new DrawContext();
    canvas.size = widget.size;
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.setFont(SECONDARY_FONT);
    canvas.setTextColor(SECONDARY_TEXT_COLOR);
    canvas.setTextAlignedCenter();

    const TEXT_HEIGHT = 20;
    const HOUR_LINE_HEIGHT = 4;
    const PIN_RADIUS = 3;
    const CROP_HOUR_SIZE = 1;
    const OFFSET_TOP = widget.size.height - TEXT_HEIGHT - HOUR_LINE_HEIGHT;
    const startIndex = getStatusIndex(graphStartDate);
    const hourWidth = widget.size.width / TIMELINE_HOURS_COUNT;
    const formatter = new DateFormatter();
    formatter.dateFormat = "HH";

    // draw timeline
    let prevStatus =
        CURRENT_PATTERN[
            (startIndex + CURRENT_PATTERN.length - 1) % CURRENT_PATTERN.length
        ];
    for (let i = 0; i < TIMELINE_HOURS_COUNT; i++) {
        const status =
            CURRENT_PATTERN[(startIndex + i) % CURRENT_PATTERN.length];
        canvas.setFillColor(getStatusColor(status));
        canvas.fillRect(
            new Rect(
                i * hourWidth + CROP_HOUR_SIZE,
                OFFSET_TOP,
                hourWidth - 2 * CROP_HOUR_SIZE,
                HOUR_LINE_HEIGHT
            )
        );
        if ((startIndex + i + 1) % 24 === 0) {
            canvas.fillRect(
                new Rect(
                    (i + 1) * hourWidth - CROP_HOUR_SIZE,
                    OFFSET_TOP - 2,
                    2 * CROP_HOUR_SIZE,
                    HOUR_LINE_HEIGHT + 4
                )
            );
        }

        if (
            (i > 0 && status !== prevStatus) ||
            (startIndex + i - 1) % MIN_TIMELINE_HOURS_LABEL === 0
        ) {
            canvas.drawTextInRect(
                formatter.string(offsetDate(graphStartDate, i)),
                new Rect(
                    (i - HOUR_BLOCK_SIZE / 2) * hourWidth,
                    OFFSET_TOP + HOUR_LINE_HEIGHT,
                    hourWidth * HOUR_BLOCK_SIZE,
                    TEXT_HEIGHT
                )
            );

            prevTimeLabelIndex = i;
        }

        prevStatus = status;
    }

    // draw current time
    const currentTimeX =
        (hourWidth * (CURRENT_DATE.getTime() - graphStartDate.getTime())) /
        HOUR_MS;
    const height = OFFSET_TOP - PIN_RADIUS;
    const path = new Path();
    path.move(new Point(currentTimeX, OFFSET_TOP));
    path.addLine(new Point(currentTimeX, OFFSET_TOP - height));
    canvas.addPath(path);
    canvas.setStrokeColor(getStatusColor(CURRENT_STATUS));
    canvas.strokePath();
    canvas.setFillColor(getStatusColor(CURRENT_STATUS));
    canvas.fillEllipse(
        new Rect(
            currentTimeX - PIN_RADIUS,
            OFFSET_TOP - height - PIN_RADIUS,
            PIN_RADIUS * 2,
            PIN_RADIUS * 2
        )
    );

    widget.addImage(canvas.getImage());
}

function drawSmallWidget() {
    drawStatus(rootWidget);
    drawUpNext(rootWidget);

    rootWidget.presentSmall();
}

function drawMediumWidget() {
    const widgetSize = getMediumWidgetSize();
    const MEDIUM_WIDGET_WIDTH = widgetSize.width - WIDGET_PADDING * 2;
    const MEDIUM_WIDGET_HEIGHT = widgetSize.height - WIDGET_PADDING * 2;
    const TOP_PORTION_HEIGHT = 0.6 * MEDIUM_WIDGET_HEIGHT;
    const BOTTOM_PORTION_HEIGHT = MEDIUM_WIDGET_HEIGHT - TOP_PORTION_HEIGHT;

    const topWidget = rootWidget.addStack();
    topWidget.size = new Size(MEDIUM_WIDGET_WIDTH, TOP_PORTION_HEIGHT);

    const leftWidget = topWidget.addStack();
    leftWidget.size = new Size(MEDIUM_WIDGET_WIDTH / 2, TOP_PORTION_HEIGHT);
    leftWidget.layoutVertically();

    const rightWidget = topWidget.addStack();
    rightWidget.size = new Size(MEDIUM_WIDGET_WIDTH / 2, TOP_PORTION_HEIGHT);
    rightWidget.layoutVertically();

    const bottomWidget = rootWidget.addStack();
    bottomWidget.size = new Size(MEDIUM_WIDGET_WIDTH, BOTTOM_PORTION_HEIGHT);

    drawStatus(leftWidget);
    drawUpNext(rightWidget, true);
    drawTimeline(bottomWidget);

    rootWidget.presentMedium();
}

function drawWidget() {
    switch (config.widgetFamily) {
        case "small":
            drawSmallWidget();
            break;
        case "medium":
        case "large":
        case "extraLarge":
        default:
            drawMediumWidget();
            break;
    }
}

function getNextEventStartDate(status) {
    let nextEventStartDate = getEndDate(CURRENT_DATE);
    while (
        status &&
        getStatus(CURRENT_PATTERN, nextEventStartDate) !== status
    ) {
        nextEventStartDate = getEndDate(nextEventStartDate);
    }
    return nextEventStartDate;
}

const CURRENT_GROUP = getGroup();
const CURRENT_DATE = new Date();
const CURRENT_PATTERN = getPattern(SEEDS.get(CURRENT_GROUP));
const CURRENT_STATUS = getStatus(CURRENT_PATTERN, CURRENT_DATE);

// setNotifications(getNextEventStartDate());

const rootWidget = setupRootWidget();
rootWidget.url = "https://poweron.loe.lviv.ua";
drawWidget();

Script.setWidget(rootWidget);
Script.complete();
