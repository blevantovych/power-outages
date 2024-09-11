import cv2

# Read an image
img = cv2.imread('./saturday_power_outages.png')
# img = cv2.imread('./friday_power_outages.png')

cell_width = 49
first_step = cell_width // 2
group_y_point = 200 # 2 group
first_cell_left_x = 50
cells_total = 24

current_x = first_cell_left_x + first_step
for i in range(cells_total):
    print(img[group_y_point, current_x])
    current_x += cell_width

# Get the color of the specified pixel (OpenCV uses BGR format)
# pixel_color = img[y, x]
# print(f"The color of the pixel at ({x}, {y}) is {pixel_color} (BGR format)")
