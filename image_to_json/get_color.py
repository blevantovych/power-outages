import matplotlib.image as mpimg

# Read an image
img = mpimg.imread('./saturday_power_outages.png')

# Specify the pixel coordinates
x, y = 10, 10

# Get the color of the specified pixel
pixel_color = img[y, x]
print(f"The color of the pixel at ({x}, {y}) is {pixel_color}")
