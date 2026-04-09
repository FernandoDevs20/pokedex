import { Routes } from '@angular/router';
import { PokemonDetail } from './features/pokemon/pages/pokemon-detail/pokemon-detail';
import { PokemonHome } from './features/pokemon/pages/pokemon-home/pokemon-home';

export const routes: Routes = [
  { path: '', component: PokemonHome },
  { path: 'pokemon/:name', component: PokemonDetail },
  { path: '**', redirectTo: '' },
];
