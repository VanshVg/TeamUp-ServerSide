export const generateColor = () => {
  try {
    let letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color as string;
  } catch (error) {
    console.log(`Error inside generateColor helper`, error);
  }
};
