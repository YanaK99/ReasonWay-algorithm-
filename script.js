import blocks from './blocks.json' assert {type: 'json'};

const container = { width: window.innerWidth, height: window.innerHeight };
const fullnessValueSpan = document.getElementById('fullnessValue');
const containerElement = document.getElementById('container');
const colorMap = {};
const debouncedResizeHandler = debounce(updateContainer, 300);

class Rect {
    constructor(width, height, left = 0, top = 0, right = 0, bottom = 0, initialOrder) {
        this.width = width;
        this.height = height;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.initialOrder = initialOrder;
    }
    rotate() {
        [this.width, this.height] = [this.height, this.width];
    }
}

function sortByHeight(a, b) {
    return b.height - a.height;
}

function tryPlaceBlock(block, container, placedBlocks) {
    const containerWidth = container.width;
    const containerHeight = container.height;
    const blockWidth = block.width;
    const blockHeight = block.height;

    for (let y = 0; y <= containerHeight - blockHeight; y++) {
        for (let x = 0; x <= containerWidth - blockWidth; x++) {
            block.left = x;
            block.top = y;
            block.right = x + blockWidth;
            block.bottom = y + blockHeight;

            let isOverlapping = false;
            for (const placedBlock of placedBlocks) {
                if (isOverlap(block, placedBlock)) {
                    isOverlapping = true;
                    break;
                }
            }

            if (!isOverlapping) {
                placedBlocks.push(block);
                return true;
            }
        }
    }
    return false;
}

function isOverlap(block1, block2) {
    return !(block1.right <= block2.left || block1.left >= block2.right ||
        block1.bottom <= block2.top || block1.top >= block2.bottom);

}

function calculateFullness(container, blocks) {
    let totalEmptySpace = 0;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const emptySpace = (block.right - block.left) * (block.bottom - block.top);
        totalEmptySpace += emptySpace;
    }

    const totalContainerArea = container.width * container.height;
    const fullness = totalEmptySpace / totalContainerArea;

    return fullness;
}

function packRectsEfficiently(container, blocks) {
    const sortedBlocks = blocks.map((block, i) => new Rect(block.width, block.height, 0, 0, 0, 0, i + 1));
    sortedBlocks.sort(sortByHeight);

    const blockCoordinates = [];
    const image = Array.from({ length: container.height }, () => Array(container.width).fill(0));

    for (const rect of sortedBlocks) {
        let done = false;
        for (let y = 0; y < container.height && !done; y++) {
            for (let x = 0; x < container.width && !done; x++) {
                if (y + rect.height <= container.height && x + rect.width <= container.width) {
                    let valid = true;
                    for (let iy = y; iy < y + rect.height; iy++) {
                        for (let ix = x; ix < x + rect.width; ix++) {
                            if (image[iy][ix] !== 0) {
                                valid = false;
                                break;
                            }
                        }
                        if (!valid) {
                            break;
                        }
                    }

                    if (valid) {
                        rect.left = x;
                        rect.top = y;
                        rect.right = x + rect.width;
                        rect.bottom = y + rect.height;
                        done = true;

                        for (let iy = y; iy < y + rect.height; iy++) {
                            for (let ix = x; ix < x + rect.width; ix++) {
                                image[iy][ix] = rect.initialOrder;
                            }
                        }

                        blockCoordinates.push({
                            top: rect.top,
                            left: rect.left,
                            right: rect.right,
                            bottom: rect.bottom,
                            initialOrder: rect.initialOrder,
                        });
                    }
                }
            }
        }
    }

    const fullness = calculateFullness(container, blockCoordinates);

    return {
        fullness,
        blockCoordinates,
    };
}

function tryPlaceBlockWithRotation(block, container, placedBlocks) {
    if (!tryPlaceBlock(block, container, placedBlocks)) {
        block.rotate();
        if (!tryPlaceBlock(block, container, placedBlocks)) {
            block.rotate();
            return false;
        }
    }
    return true;
}

let placedBlocks = [];

let rectBlocks = blocks.map(block => new Rect(block.width, block.height));

rectBlocks.forEach(block => {
    if (!tryPlaceBlockWithRotation(block, container, placedBlocks)) {
        console.log('Could not place block:', block);
    }
});

let result = packRectsEfficiently(container, blocks);
console.log(result)

if (fullnessValueSpan) {
    fullnessValueSpan.textContent = result.fullness.toFixed(2);
}


//====================================================//
const randomColor = () => {
    const minValue = 0;
    const maxValue = parseInt("ffffff", 16);

    const randomDecimal = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;

    return `#${randomDecimal.toString(16)}`;

}

//====================================================//


const render = () => {
    containerElement.innerHTML = '';
    result.blockCoordinates.forEach((block) => {
        const blockElement = document.createElement('div');
        blockElement.className = 'block';
        blockElement.style.width = block.right - block.left + 'px';
        blockElement.style.height = block.bottom - block.top + 'px';
        blockElement.style.left = block.left + 'px';
        blockElement.style.top = block.top + 'px';
        const backgroundRectangle = document.createElement('div');
        backgroundRectangle.className = 'background-rectangle';
        backgroundRectangle.textContent = block.initialOrder;
        blockElement.appendChild(backgroundRectangle);
        const square = (block.bottom - block.top) * (block.right - block.left);
        if (colorMap[square]) {
            blockElement.style.backgroundColor = colorMap[square]
        } else {
            const newColor = randomColor()
            blockElement.style.backgroundColor = newColor
            colorMap[square] = newColor
        }
        containerElement.appendChild(blockElement);
    });
}

render()

//====================================================//

function updateContainerSize() {
    container.width = window.innerWidth;
    container.height = window.innerHeight;
}

function updateContainer() {
    updateContainerSize();
    placedBlocks = [];
    rectBlocks.forEach(block => {
        if (!tryPlaceBlockWithRotation(block, container, placedBlocks)) {
            console.log('Could not place block:', block);
        }
    });

    const updatedResult = packRectsEfficiently(container, blocks);
    console.log(updatedResult);

    const fullnessValueSpan = document.getElementById('fullnessValue');
    if (fullnessValueSpan) {
        fullnessValueSpan.textContent = updatedResult.fullness.toFixed(2);
    }

    result = updatedResult;
    render();
    console.log('resize');
}


function debounce(func, delay) {
    let timeoutId;
    return function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, arguments), delay);
    };
}

window.addEventListener('resize', debouncedResizeHandler);


