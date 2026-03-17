import { Container, Box, AppBar, Toolbar, Typography } from '@mui/material'
import HomePage from '@pages/HomePage'
import logo from './assets/dv_logo.png'

export default function App() {
  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(90deg, #1E293B, #171832, #334155)',
          boxShadow: '0 6px 12px rgb(41, 41, 41)',
          borderBottom: '1px solid rgb(135, 135, 135)',
        }}
      >
        <Toolbar>
          {/* Your Logo Image */}
          <img
            src={logo}
            alt="Dragonvite Logo"
            style={{
              height: 100,
              marginRight: 12,
              filter: 'drop-shadow(0 1px 2px rgba(39, 39, 39, 0.5))'
            }}
          />

          {/* Your Text */}
          <Typography
            variant="h5"
            sx={{
              color: '#F1F5F9', // brighter than before
              fontWeight: 500,
              textShadow: '2px 2px 4px rgba(146, 146, 146, 0.5)',
            }}
          >
            DragonVite - Campaign Manager & VTT
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main">
        <Container maxWidth="lg">
          <HomePage />
        </Container>
      </Box>
    </>
  )
}
