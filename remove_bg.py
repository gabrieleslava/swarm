import cv2
import numpy as np
import sys

def remove_background(input_path, output_path):
    # Load image
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    
    # Check if image has alpha
    if img.shape[2] == 3:
        # Add alpha channel
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    # Simple threshold to remove white background
    # Assuming the background is very close to white
    lower_white = np.array([240, 240, 240, 255])
    upper_white = np.array([255, 255, 255, 255])
    
    # Create mask (white areas)
    mask = cv2.inRange(img, lower_white, upper_white)
    
    # Invert mask (mask of the object)
    mask_inv = cv2.bitwise_not(mask)
    
    # Separate channels
    b, g, r, a = cv2.split(img)
    
    # Apply mask to alpha channel
    a = cv2.bitwise_and(a, mask_inv)
    
    # Merge back
    result = cv2.merge((b, g, r, a))
    
    cv2.imwrite(output_path, result)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input> <output>")
    else:
        remove_background(sys.argv[1], sys.argv[2])
